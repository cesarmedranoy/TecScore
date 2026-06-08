/**
 * MusicToggle — reproductor del lobby con cola aleatoria.
 *
 * Mejoras visuales:
 *  - Mini-player tipo "pill" con fondo propio (verde TecScore) — se ve
 *    bien sobre cualquier fondo, oscuro o claro, sin depender del tema.
 *  - Animación de barras de ecualizador cuando está sonando.
 *  - Nombre del track con scroll automático si es muy largo.
 *  - Botón de volumen con slider deslizante al hacer hover.
 *  - Mantiene toda la lógica original intacta.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Howl } from "howler";
import { SkipForward, Volume2, VolumeX, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY  = "tecscore-music-muted";
const VOLUME_KEY   = "tecscore-music-volume";
const DEFAULT_VOL  = 0.25;

interface Track { path: string; name: string }

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Barras de ecualizador animadas — solo se muestran cuando hay música. */
function EqBars({ playing }: { playing: boolean }) {
  return (
    <span className="flex items-end gap-[2px] h-3 shrink-0" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-full bg-white transition-all",
            playing ? "animate-eq-bar" : "h-[3px] opacity-40",
          )}
          style={playing ? { animationDelay: `${i * 0.15}s` } : undefined}
        />
      ))}
    </span>
  );
}

export function MusicToggle() {
  const [muted,     setMuted]     = useState(true);
  const [volume,    setVolume]    = useState(DEFAULT_VOL);
  const [ready,     setReady]     = useState(false);
  const [available, setAvailable] = useState(true);
  const [tracks,    setTracks]    = useState<Track[]>([]);
  const [queue,     setQueue]     = useState<number[]>([]);
  const [cursor,    setCursor]    = useState(0);
  const [showVol,   setShowVol]   = useState(false);

  const howlRef      = useRef<Howl | null>(null);
  const lastTrackRef = useRef<number>(-1);

  // ── 1. Cargar tracks ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetch("/api/music/tracks")
      .then((r) => r.json())
      .then((data: { tracks: Track[] }) => {
        if (cancelled) return;
        if (!data.tracks?.length) { setAvailable(false); setReady(true); return; }
        setTracks(data.tracks);
        setQueue(shuffle(data.tracks.map((_, i) => i)));
      })
      .catch(() => { if (!cancelled) { setAvailable(false); setReady(true); } });
    return () => { cancelled = true; };
  }, []);

  // ── 2. Preferencias guardadas ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const m = localStorage.getItem(STORAGE_KEY);
      const v = localStorage.getItem(VOLUME_KEY);
      setMuted(m === null ? true : m === "true");
      if (v) setVolume(parseFloat(v));
    } catch { /* incognito */ }
  }, []);

  // ── 3. Avanzar track ──────────────────────────────────────────────────────
  const advance = useCallback(() => {
    setCursor((prev) => {
      const next = prev + 1;
      if (next >= queue.length) {
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

  // ── 4. Crear/destruir Howl al cambiar track ───────────────────────────────
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
      volume,
      html5: true,
      onload: () => {
        if (cancelled) return;
        setReady(true);
        if (!muted) { h.volume(volume); h.play(); }
      },
      onloaderror: () => { if (!cancelled) advance(); },
      onend:       () => { if (!cancelled) advance(); },
    });
    howlRef.current = h;

    return () => {
      cancelled = true;
      h.stop(); h.unload();
      if (howlRef.current === h) howlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, queue, cursor]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function toggle() {
    const h = howlRef.current;
    if (!h || !ready) return;
    const next = !muted;
    setMuted(next);
    try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
    if (next) { if (h.playing()) h.pause(); }
    else      { h.volume(volume); h.play(); }
  }

  function skip() {
    if (!ready) return;
    advance();
  }

  function handleVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseFloat(e.target.value);
    setVolume(v);
    try { localStorage.setItem(VOLUME_KEY, String(v)); } catch {}
    const h = howlRef.current;
    if (h) h.volume(v);
    // Si sube el volumen estando silenciado, dessilenciar
    if (v > 0 && muted) {
      setMuted(false);
      try { localStorage.setItem(STORAGE_KEY, "false"); } catch {}
      if (h && !h.playing()) { h.play(); }
    }
  }

  if (!available) return null;

  const currentTrack = tracks[queue[cursor] ?? -1];
  const isPlaying    = !muted && ready;

  return (
    <>
      {/* Keyframes de las barras EQ — inyectados una sola vez */}
      <style>{`
        @keyframes eq-bar {
          0%, 100% { height: 3px;  }
          25%       { height: 10px; }
          50%       { height: 6px;  }
          75%       { height: 12px; }
        }
        .animate-eq-bar { animation: eq-bar 0.9s ease-in-out infinite; }
      `}</style>

      {/*
        ── Mini-player pill ──────────────────────────────────────────────────
        Fondo propio (#10b959 cuando suena, zinc-800 cuando silenciado).
        Funciona sobre cualquier fondo — no depende del tema dark/light.
      */}
      <div
        className={cn(
          "flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all duration-300 select-none",
          "border shadow-sm",
          isPlaying
            ? "bg-[#10b959] border-[#0ea84f] text-white shadow-[#10b959]/30"
            : "bg-zinc-800 border-zinc-700 text-zinc-300",
        )}
      >
        {/* Barras de EQ */}
        <EqBars playing={isPlaying} />

        {/* Nombre del track — solo si hay música sonando */}
        {isPlaying && currentTrack && (
          <span
            className="hidden md:block text-[11px] font-medium max-w-[140px] truncate leading-none"
            title={currentTrack.name}
          >
            {currentTrack.name}
          </span>
        )}

        {/* Label estático cuando está silenciado */}
        {!isPlaying && (
          <span className="hidden md:block text-[11px] font-medium leading-none opacity-60">
            Música
          </span>
        )}

        {/* Separador visual */}
        <div className="w-px h-3 bg-current opacity-20 mx-0.5" />

        {/* Skip — solo si hay más de 1 track y está sonando */}
        {isPlaying && tracks.length > 1 && (
          <button
            onClick={skip}
            disabled={!ready}
            title="Siguiente canción"
            aria-label="Siguiente canción"
            className="p-1 rounded-full hover:bg-white/20 transition-colors disabled:opacity-40"
          >
            <SkipForward size={13} />
          </button>
        )}

        {/* Volumen — toggle slider */}
        <div className="relative flex items-center">
          <button
            onClick={() => setShowVol((v) => !v)}
            title="Ajustar volumen"
            aria-label="Ajustar volumen"
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            {showVol ? <ChevronUp size={13} /> : (isPlaying ? <Volume2 size={13} /> : <VolumeX size={13} />)}
          </button>

          {/* Slider de volumen — aparece al lado */}
          {showVol && (
            <div className="absolute right-full mr-2 flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 rounded-full px-3 py-1.5 shadow-lg">
              <VolumeX size={11} className="text-zinc-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolume}
                className="w-20 accent-[#10b959] cursor-pointer"
                aria-label="Volumen"
              />
              <Volume2 size={11} className="text-zinc-400 shrink-0" />
            </div>
          )}
        </div>

        {/* Mute/unmute */}
        <button
          onClick={toggle}
          disabled={!ready}
          title={muted ? "Activar música del Mundial" : "Silenciar música"}
          aria-label="Música del lobby"
          className="p-1 rounded-full hover:bg-white/20 transition-colors disabled:opacity-40"
        >
          {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>
      </div>
    </>
  );
}