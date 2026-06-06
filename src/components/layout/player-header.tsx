/**
 * PlayerHeader — barra superior pegada arriba del contenido.
 */

import type { ReactNode } from "react";
import { PlayerPill } from "@/components/gamified/player-pill";
import { ThemeToggle } from "./theme-toggle";
import { MusicToggle } from "./music-toggle";
import type { AvatarPreset } from "@/types";

interface PlayerHeaderProps {
  name: string;
  tag: string;
  avatarUrl?: string;
  customAvatarDataUrl?: string;
  avatarPreset?: AvatarPreset;
  points: number;
  streak: number;
  actions?: ReactNode;
}

export function PlayerHeader({
  name,
  tag,
  avatarUrl,
  customAvatarDataUrl,
  avatarPreset,
  points,
  streak,
  actions,
}: PlayerHeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border px-6 py-3 flex items-center justify-between gap-4">
      <PlayerPill
        name={name}
        tag={tag}
        avatarUrl={avatarUrl}
        customAvatarDataUrl={customAvatarDataUrl}
        avatarPreset={avatarPreset}
        points={points}
        streak={streak}
      />
      <div className="flex items-center gap-1">
        {actions}
        <MusicToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
