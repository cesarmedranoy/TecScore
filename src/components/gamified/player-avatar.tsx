/**
 * PlayerAvatar — renderiza el avatar del usuario respetando su preset elegido.
 *
 * Variantes:
 *  - "google" (default): foto de Google + iniciales como fallback
 *  - "flag:X":           bandera emoji en círculo de color
 *  - "cup":              imagen del trofeo del Mundial (cup-coin.png)
 *
 * Se usa en todas las superficies donde antes íbamos directo a `<Avatar>`.
 * Si quieres mostrar SIEMPRE la foto de Google sin importar el preset,
 * usá `<Avatar>` directo.
 */

"use client";

import Image from "next/image";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn, getInitials } from "@/lib/utils";
import { getFlag } from "@/lib/teams/flags";
import type { AvatarPreset } from "@/types";

interface PlayerAvatarProps {
  name: string;
  avatarUrl?: string;
  preset?: AvatarPreset;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  xs: "size-7 text-xs",
  sm: "size-9 text-sm",
  md: "size-12 text-base",
  lg: "size-16 text-xl",
  xl: "size-24 text-3xl",
} as const;

const FLAG_FONT_SIZE = {
  xs: "text-base",
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-5xl",
} as const;

export function PlayerAvatar({
  name,
  avatarUrl,
  preset = "google",
  size = "md",
  className,
}: PlayerAvatarProps) {
  const sizeClass = SIZE_MAP[size];

  // Variante: bandera
  if (preset.startsWith("flag:")) {
    const country = preset.substring(5);
    const flag = getFlag(country);
    return (
      <div
        className={cn(
          "rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800 select-none",
          sizeClass,
          FLAG_FONT_SIZE[size],
          className,
        )}
        title={`Bandera de ${country}`}
      >
        <span className="leading-none">{flag}</span>
      </div>
    );
  }

  // Variante: cup-coin
  if (preset === "cup") {
    return (
      <div
        className={cn(
          "rounded-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-yellow-200 dark:from-amber-950/40 dark:to-yellow-900/30 border border-amber-300 dark:border-amber-700 select-none overflow-hidden p-1",
          sizeClass,
          className,
        )}
        title="Copa del Mundial"
      >
        <Image
          src="/icons/cup-coin.png"
          alt="Copa del Mundial"
          width={96}
          height={96}
          className="w-full h-full object-contain"
          unoptimized
        />
      </div>
    );
  }

  // Default: Google avatar + fallback iniciales
  return (
    <Avatar className={cn(sizeClass, className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
