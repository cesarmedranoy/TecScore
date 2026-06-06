/**
 * GET /api/music/tracks — lista los mp3/wav/ogg/m4a en `public/audio/`.
 *
 * Auto-descubre los archivos para que agregar/quitar canciones sea solo
 * pegar/borrar el archivo en la carpeta. Sin necesidad de tocar el código.
 *
 * Devuelve cada track con un nombre legible (reemplaza guiones y
 * underscores por espacios).
 */

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

interface Track {
  path: string;
  name: string;
}

function prettify(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "") // quita extensión
    .replace(/[_-]+/g, " ") // underscores y hyphens → espacios
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(): Promise<NextResponse<{ tracks: Track[] }>> {
  try {
    const dir = join(process.cwd(), "public", "audio");
    const files = await readdir(dir);
    const tracks: Track[] = files
      .filter((f) => /\.(mp3|wav|ogg|m4a)$/i.test(f))
      .sort()
      .map((f) => ({
        path: `/audio/${f}`,
        name: prettify(f),
      }));
    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json({ tracks: [] });
  }
}
