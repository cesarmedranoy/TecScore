/**
 * MusicToggle — botón para prender/silenciar la música del lobby.
 *
 * Implementación senior tras debug:
 *  - SIN fade (HTML5 audio + Howler.fade da saltos raros). Play/pause directo.
 *  - Strict-mode safe: una flag `cancelled` evita callbacks de Howl viejos.
 *  - Si el archivo no existe, el botón se oculta silenciosamente.
 *  - El estado se persiste en localStorage; el browser sigue bloqueando
 *    autoplay sin click, así que el usuario siempre arranca con un click.
 *
 * Track esperado en `public/audio/` (path en TRACK_PATH).
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import { Music, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "tecscore-music-muted";
const TRACK_PATH = "/audio/daidai_shakira.mp3";
const VOLUME = 0.25;

export function MusicToggle() {
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(true);
  const howlRef = useRef<Howl | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Leer preferencia previa (default: mute)
    let savedMuted = true;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      savedMuted = v === null ? true : v === "true";
    } catch {
      /* localStorage bloqueado (modo incógnito) */
    }
    setMuted(savedMuted);

    const h = new Howl({
      src: [TRACK_PATH],
      loop: true,
      volume: VOLUME,
      html5: true, // streaming para tracks largos
      onload: () => {
        if (cancelled) return;
        setReady(true);
      },
      onloaderror: (_, err) => {
        if (cancelled) return;
        console.warn("[MusicToggle] no se pudo cargar el track:", err);
        setAvailable(false);
        setReady(true);
      },
    });
    howlRef.current = h;

    return () => {
      cancelled = true;
      h.stop();
      h.unload();
      if (howlRef.current === h) howlRef.current = null;
    };
  }, []);

  function toggle() {
    const h = howlRef.current;
    if (!h || !ready) return;
    const next = !muted;
    setMuted(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {}
    if (next) {
      // Silenciar = pause
      if (h.playing()) h.pause();
    } else {
      // Activar = play (asegurando volumen correcto por si quedó en 0)
      h.volume(VOLUME);
      h.play();
    }
  }

  if (!available) return null;

  return (
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
  );
}
