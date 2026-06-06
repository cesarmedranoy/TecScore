/**
 * MusicToggle — botón para prender/silenciar la música del lobby.
 *
 * Howler.js maneja el audio (carga, loop, fade, volumen).
 *
 * Reglas:
 *  - Default mute (los browsers bloquean autoplay sin interacción).
 *  - La preferencia se persiste en localStorage.
 *  - Fade-in/out de 500ms al alternar (no corte abrupto).
 *
 * Track esperado: `public/audio/lobby.mp3` (mp3 libre de derechos).
 * Si el archivo no existe, el botón se deshabilita silenciosamente.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { Howl } from "howler";
import { Music, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "tecscore-music-muted";
const TRACK_PATH = "/audio/lobby.mp3";
const VOLUME = 0.25;
const FADE_MS = 500;

export function MusicToggle() {
  const [muted, setMuted] = useState(true);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(true);
  const howlRef = useRef<Howl | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {}
    const initial = saved === null ? true : saved === "true";
    setMuted(initial);

    howlRef.current = new Howl({
      src: [TRACK_PATH],
      loop: true,
      volume: 0,
      html5: true, // streaming en vez de descarga completa
      onload: () => {
        setReady(true);
        if (!initial) {
          howlRef.current?.play();
          howlRef.current?.fade(0, VOLUME, FADE_MS);
        }
      },
      onloaderror: () => {
        // El archivo no existe — desactivamos el botón silenciosamente
        setAvailable(false);
        setReady(true);
      },
    });

    return () => {
      howlRef.current?.unload();
    };
  }, []);

  function toggle() {
    const next = !muted;
    setMuted(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {}
    if (!howlRef.current) return;
    if (next) {
      howlRef.current.fade(VOLUME, 0, FADE_MS);
      setTimeout(() => howlRef.current?.pause(), FADE_MS);
    } else {
      if (!howlRef.current.playing()) howlRef.current.play();
      howlRef.current.fade(0, VOLUME, FADE_MS);
    }
  }

  if (!available) {
    return null;
  }

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
