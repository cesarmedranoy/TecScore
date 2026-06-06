/**
 * MusicToggle — reproductor del lobby con cola aleatoria.
 *
 * Features senior:
 *  - **Auto-discover** de tracks desde `/api/music/tracks` (lista filesystem)
 *  - **Shuffle sin repeticiones**: Fisher-Yates. Cuando se agota la cola,
 *    se barajan de nuevo (con guard para no repetir la última que sonó).
 *  - **Pause/resume preserva posición**: usa Howler.pause()/play() del MISMO
 *    Howl. NO recrea la instancia al silenciar (eso era el bug que reiniciaba).
 *  - **Auto-advance**: cuando termina un track, salta al siguiente de la cola.
 *  - **Skip manual**: botón para saltar al siguiente.
 *  - **Strict-mode safe**: `cancelled` evita callbacks viejos.
 *  - Muestra el nombre del track actual cuando suena.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Howl } from "howler";
import { Music, VolumeX, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "tecscore-music-muted";
const VOLUME = 0.25;

interface Track {
  path: string;
  name: string;
}

/** Fisher-Yates shuffle in-place + retorno. */
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export function MusicToggle() {
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(true);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [queue, setQueue] = useState<number[]>([]);
  const [cursor, setCursor] = useState(0);
  const howlRef = useRef<Howl | null>(null);
  const lastTrackRef = useRef<number>(-1);

  // 1) Cargar lista de tracks una sola vez
  useEffect(() => {
    let cancelled = false;
    fetch("/api/music/tracks")
      .then((r) => r.json())
      .then((data: { tracks: Track[] }) => {
        if (cancelled) return;
        if (!data.tracks?.length) {
          setAvailable(false);
          setReady(true);
          return;
        }
        setTracks(data.tracks);
        const indices = data.tracks.map((_, i) => i);
        setQueue(shuffle(indices));
      })
      .catch(() => {
        if (cancelled) return;
        setAvailable(false);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Leer preferencia mute del localStorage
  useEffect(() => {
    let saved = true;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      saved = v === null ? true : v === "true";
    } catch {
      /* no localStorage en incognito */
    }
    setMuted(saved);
  }, []);

  // Helper: avanzar al siguiente track de la cola, reshuffle si llegó al final
  const advance = useCallback(() => {
    setCursor((prev) => {
      const next = prev + 1;
      if (next >= queue.length) {
        // Reshuffle. Garantiza que el siguiente no sea el último que sonó
        // (evita el "molesto" de escuchar la misma 2 veces seguidas).
        setQueue((current) => {
          if (current.length <= 1) return current;
          let attempt = shuffle(current);
          let tries = 0;
          while (attempt[0] === lastTrackRef.current && tries < 5) {
            attempt = shuffle(current);
            tries++;
          }
          return attempt;
        });
        return 0;
      }
      return next;
    });
  }, [queue.length]);

  // 3) Crear/destruir Howl al cambiar de track
  // IMPORTANTE: las deps son [tracks, queue, cursor]. Mute NO está acá
  // porque cambiar mute NO debe recrear el Howl (eso era el bug de reset).
  useEffect(() => {
    if (!tracks.length || !queue.length) return;
    const trackIdx = queue[cursor];
    if (trackIdx === undefined) return;
    const track = tracks[trackIdx];
    if (!track) return;

    lastTrackRef.current = trackIdx;

    let cancelled = false;
    const h = new Howl({
      src: [track.path],
      loop: false,
      volume: VOLUME,
      html5: true,
      onload: () => {
        if (cancelled) return;
        setReady(true);
        // Si el usuario tenía mute=false (música activa), seguir tocando
        if (!muted) {
          h.volume(VOLUME);
          h.play();
        }
      },
      onloaderror: () => {
        if (cancelled) return;
        // Track corrupto / inexistente → saltar
        advance();
      },
      onend: () => {
        if (cancelled) return;
        advance();
      },
    });
    howlRef.current = h;

    return () => {
      cancelled = true;
      h.stop();
      h.unload();
      if (howlRef.current === h) howlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, queue, cursor]);

  function toggle() {
    const h = howlRef.current;
    if (!h || !ready) return;
    const next = !muted;
    setMuted(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {}
    if (next) {
      // Silenciar — pausa preserva posición
      if (h.playing()) h.pause();
    } else {
      // Activar — resume desde donde quedó
      h.volume(VOLUME);
      h.play();
    }
  }

  function skip() {
    if (!ready) return;
    advance();
  }

  if (!available) return null;

  const currentTrack = tracks[queue[cursor] ?? -1];

  return (
    <div className="flex items-center gap-0.5">
      {!muted && currentTrack && (
        <span
          className={cn(
            "hidden md:inline-block text-xs text-muted-foreground max-w-[160px] truncate px-2",
            "animate-in fade-in slide-in-from-right-2 duration-300",
          )}
          title={currentTrack.name}
        >
          ♪ {currentTrack.name}
        </span>
      )}
      {!muted && tracks.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={skip}
          disabled={!ready}
          title="Siguiente canción"
          aria-label="Siguiente canción"
        >
          <SkipForward />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        disabled={!ready}
        title={muted ? "Activar música del Mundial" : "Silenciar música"}
        aria-label="Música del lobby"
      >
        {muted ? <VolumeX /> : <Music />}
      </Button>
    </div>
  );
}
