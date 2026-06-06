/**
 * PointsBadge — pill dorado con la cantidad de puntos del jugador.
 *
 * Es el "score visible" del dashboard. Se ve en la esquina superior
 * del header. Diseño: gradient sutil dorado + ícono de la copa del
 * Mundial (imagen custom en `public/icons/cup-coin.png`).
 *
 * Si la imagen no existe todavía, mostramos un fallback en SVG inline
 * para que no se vea roto durante el desarrollo.
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
  sm: { wrapper: "h-7 px-2.5 text-xs gap-1.5", icon: 14 },
  md: { wrapper: "h-9 px-3.5 text-sm gap-2", icon: 18 },
  lg: { wrapper: "h-11 px-5 text-base gap-2.5", icon: 22 },
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
          style={{ width: icon, height: icon }}
        />
      ) : (
        <Image
          src="/icons/cup-coin.png"
          alt="Copa del Mundial"
          width={icon}
          height={icon}
          className="drop-shadow-sm"
          onError={() => setImgFailed(true)}
          unoptimized
          priority={size === "lg"}
        />
      )}
      <span className="tabular-nums">{points.toLocaleString("es-PE")}</span>
      <span className="text-amber-700/70 dark:text-amber-400/70 text-[0.85em] font-medium">
        pts
      </span>
    </div>
  );
}
