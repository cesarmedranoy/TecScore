/**
 * PointsBadge — pill dorado con la cantidad de puntos del jugador.
 *
 * El ícono es la imagen del trofeo del Mundial en `public/icons/cup-coin.png`
 * (PNG con fondo transparente). Si no existe, cae al ícono Lucide.
 *
 * Diseño: el trofeo es el protagonista visual — sobresale del pill ligeramente
 * y tiene una sombra dorada sutil para destacarlo (drop-shadow gold).
 */

"use client";

import Image from "next/image";
import { useState } from "react";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface PointsBadgeProps {
  points: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: { wrapper: "h-7 pl-1 pr-2.5 text-xs gap-1.5", icon: 22 },
  md: { wrapper: "h-9 pl-1 pr-3.5 text-sm gap-2", icon: 30 },
  lg: { wrapper: "h-11 pl-1.5 pr-5 text-base gap-2.5", icon: 38 },
} as const;

export function PointsBadge({
  points,
  size = "md",
  className,
}: PointsBadgeProps) {
  const { wrapper, icon } = sizeConfig[size];
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className={cn(
        "inline-flex items-center font-semibold rounded-full select-none",
        "bg-gradient-to-br from-amber-50 to-yellow-100 text-amber-900 border border-amber-200",
        "dark:from-amber-950/40 dark:to-yellow-900/30 dark:text-amber-200 dark:border-amber-800/50",
        "shadow-sm hover:shadow-md transition-shadow",
        wrapper,
        className,
      )}
    >
      {imgFailed ? (
        <Trophy
          className="text-amber-600 dark:text-amber-400"
          style={{ width: icon * 0.55, height: icon * 0.55 }}
        />
      ) : (
        <Image
          src="/icons/cup-coin.png"
          alt="Copa del Mundial"
          width={icon}
          height={icon}
          className="drop-shadow-[0_2px_4px_rgba(234,179,8,0.4)] -my-1"
          onError={() => setImgFailed(true)}
          unoptimized
          priority={size === "lg"}
        />
      )}
      <span className="tabular-nums leading-none">
        {points.toLocaleString("es-PE")}
      </span>
      <span className="text-amber-700/70 dark:text-amber-400/70 text-[0.85em] font-medium">
        pts
      </span>
    </div>
  );
}
