/**
 * StreakBadge — pill con la racha actual de aciertos.
 *
 * Solo se muestra si streak > 0 (no tiene sentido "racha de 0").
 * Animación pulse en la llama cuando la racha es múltiplo de 3
 * (justo cuando disparaste un bonus — celebración visual).
 */

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md";
  className?: string;
}

export function StreakBadge({
  streak,
  size = "md",
  className,
}: StreakBadgeProps) {
  if (streak <= 0) return null;

  const isBonusMilestone = streak > 0 && streak % 3 === 0;

  const sizes = {
    sm: "h-6 px-2 text-xs gap-1 [&_svg]:size-3",
    md: "h-7 px-2.5 text-xs gap-1.5 [&_svg]:size-3.5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center font-semibold rounded-full",
        "bg-gradient-to-br from-orange-50 to-red-50 text-orange-700 border border-orange-200",
        "dark:from-orange-950/40 dark:to-red-950/30 dark:text-orange-300 dark:border-orange-800/50",
        sizes[size],
        className,
      )}
      title={
        isBonusMilestone
          ? `¡Racha de ${streak}! Acabás de ganar bonus de +2 pts`
          : `Llevás ${streak} aciertos seguidos`
      }
    >
      <Flame
        className={cn(
          "text-orange-500 dark:text-orange-400",
          isBonusMilestone && "animate-pulse",
        )}
      />
      <span className="tabular-nums">{streak}</span>
    </div>
  );
}
