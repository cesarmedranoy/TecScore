/**
 * PointsBadge — pill dorado con la cantidad de puntos del jugador.
 *
 * Es el "score visible" del dashboard. Se ve en la esquina superior
 * del header. Diseño: gradient sutil dorado + icono de trofeo.
 */

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface PointsBadgeProps {
  points: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PointsBadge({
  points,
  size = "md",
  className,
}: PointsBadgeProps) {
  const sizes = {
    sm: "h-7 px-2.5 text-xs gap-1.5 [&_svg]:size-3",
    md: "h-9 px-3.5 text-sm gap-2 [&_svg]:size-4",
    lg: "h-11 px-5 text-base gap-2.5 [&_svg]:size-5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center font-semibold rounded-full",
        "bg-gradient-to-br from-amber-50 to-yellow-100 text-amber-900 border border-amber-200",
        "dark:from-amber-950/40 dark:to-yellow-900/30 dark:text-amber-200 dark:border-amber-800/50",
        "shadow-sm",
        sizes[size],
        className,
      )}
    >
      <Trophy className="text-amber-600 dark:text-amber-400" />
      <span className="tabular-nums">{points.toLocaleString("es")}</span>
      <span className="text-amber-700/70 dark:text-amber-400/70 text-[0.85em] font-medium">
        pts
      </span>
    </div>
  );
}
