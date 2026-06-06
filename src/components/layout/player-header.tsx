/**
 * PlayerHeader — barra superior pegada arriba del contenido.
 *
 * Muestra el PlayerPill (avatar + nombre + puntos + racha)
 * y a la derecha un slot opcional para acciones contextuales.
 */

import type { ReactNode } from "react";
import { PlayerPill } from "@/components/gamified/player-pill";

interface PlayerHeaderProps {
  name: string;
  tag: string;
  avatarUrl?: string;
  points: number;
  streak: number;
  actions?: ReactNode;
}

export function PlayerHeader({
  name,
  tag,
  avatarUrl,
  points,
  streak,
  actions,
}: PlayerHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border px-8 py-4 flex items-center justify-between">
      <PlayerPill
        name={name}
        tag={tag}
        avatarUrl={avatarUrl}
        points={points}
        streak={streak}
      />
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
