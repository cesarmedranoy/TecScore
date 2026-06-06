/**
 * PlayerPill — bloque compacto con avatar + nombre#tag + puntos.
 *
 * Va en la esquina superior izquierda del dashboard, como pediste:
 *   "Cada jugador obvio ganara sus puntos, esos puntos ubicadas en la
 *    esquina izquierda arriba del dashboard junto con el (avatar)
 *    NombreEjemplo#tag12f 100 (icono de puntos) pts"
 */

import { PlayerAvatar } from "./player-avatar";
import { PointsBadge } from "./points-badge";
import { StreakBadge } from "./streak-badge";
import { cn } from "@/lib/utils";
import type { AvatarPreset } from "@/types";

interface PlayerPillProps {
  name: string;
  tag: string;
  avatarUrl?: string;
  avatarPreset?: AvatarPreset;
  points: number;
  streak: number;
  compact?: boolean;
  className?: string;
}

export function PlayerPill({
  name,
  tag,
  avatarUrl,
  avatarPreset = "google",
  points,
  streak,
  compact = false,
  className,
}: PlayerPillProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <PlayerAvatar
        name={name}
        avatarUrl={avatarUrl}
        preset={avatarPreset}
        size={compact ? "sm" : "md"}
      />
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-baseline gap-0 truncate">
          <span className="font-semibold text-foreground truncate">
            {name}
          </span>
          <span className="text-muted-foreground font-medium">
            #{tag}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <PointsBadge points={points} size="sm" />
          {streak > 0 && <StreakBadge streak={streak} size="sm" />}
        </div>
      </div>
    </div>
  );
}
