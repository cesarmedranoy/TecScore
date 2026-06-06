# 02 — Reproductor de música del lobby

## Qué hay que hacer

Música ambiente tipo FIFA Mobile en el lobby (landing y dashboard).
**Con botón de mute persistente** — el usuario que la mutea no la escucha más
hasta que la prenda de nuevo.

## Por qué

Está en los requerimientos originales del enunciado:
> "la opcion de que en el lobby ni bien se inicia partidos o en el lobby suene
> una musica asi como el app fifa mobile que tiene en el lobby su musica, pero
> en este caso de los mundiales cancion de mundiales co opcion a muter esa
> cancion por si molesta al usuario"

## Stack

Howler.js — la librería estándar para audio web. Tiene control fino del
volumen, fade-in/out, loop, etc.

```bash
npm install howler
npm install -D @types/howler
```

## Pasos sugeridos

### 1. Conseguir un track

Buscá una pista libre de derechos en YouTube Audio Library o Pixabay Music
con vibe mundialista. Algunas keywords: "stadium chant", "world cup epic",
"upbeat sport". Guardalo en `public/audio/lobby.mp3`.

⚠️ Asegurate que el archivo tenga licencia que permita uso académico.
Documentá la fuente en un comentario.

### 2. Crear el componente

`src/components/layout/music-player.tsx`:

```tsx
"use client";

import { Howl } from "howler";
import { Music, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function MusicPlayer() {
  const [muted, setMuted] = useState(true); // Default mute (browsers bloquean autoplay)
  const howlRef = useRef<Howl | null>(null);

  useEffect(() => {
    // Leer preferencia
    const saved = localStorage.getItem("tecscore-music-muted");
    const initialMuted = saved === null ? true : saved === "true";
    setMuted(initialMuted);

    howlRef.current = new Howl({
      src: ["/audio/lobby.mp3"],
      loop: true,
      volume: 0.3, // suave
      autoplay: false, // arrancamos manualmente
    });

    if (!initialMuted) howlRef.current.play();
    return () => {
      howlRef.current?.stop();
    };
  }, []);

  function toggle() {
    const next = !muted;
    setMuted(next);
    localStorage.setItem("tecscore-music-muted", String(next));
    if (next) {
      howlRef.current?.fade(0.3, 0, 500);
      setTimeout(() => howlRef.current?.pause(), 500);
    } else {
      howlRef.current?.play();
      howlRef.current?.fade(0, 0.3, 500);
    }
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle} title={muted ? "Activar música" : "Silenciar música"}>
      {muted ? <VolumeX /> : <Music />}
    </Button>
  );
}
```

### 3. Importarlo en el layout del player

En `src/app/(player)/layout.tsx`, en el header al lado del PlayerPill.

⚠️ **No lo pongas en el layout admin** — el admin no necesita música mientras
trabaja.

## Acceptance criteria

- [ ] Hay un botón visible en el dashboard que prende/apaga la música
- [ ] La preferencia mute/unmute se persiste entre sesiones
- [ ] Default mute (browsers modernos bloquean autoplay sin interacción)
- [ ] Volumen suave (0.3) — no estridente
- [ ] Loop infinito mientras esté unmuted y navegues entre páginas del
      dashboard
- [ ] Al cerrar sesión, la música se detiene

## Tips

- Si la música suena cortada al cambiar de página: el problema es que el
  componente se desmonta. Mové la lógica de Howl a un Context o usá un
  layout más arriba.
- Usá fade-in/out (no corte abrupto) para que se sienta pro.
- Testealo con auriculares — la primera impresión vende.

## Esfuerzo

3-4 horas (la mitad buscando un track decente).
