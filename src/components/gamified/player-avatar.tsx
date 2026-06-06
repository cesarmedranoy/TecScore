/**
 * PlayerAvatar — renderiza el avatar del usuario respetando su preset elegido.
 *
 * Variantes:
 *  - "google" (default): foto de Google + iniciales como fallback
 *  - "flag:X":           bandera emoji en círculo de color
 *  - "custom":           foto subida por el usuario (data URL en customAvatarDataUrl)
 *
 * Si el preset es "custom" pero no hay customAvatarDataUrl, cae a "google".
 */

"use client";

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
  customAvatarDataUrl?: string;
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
  customAvatarDataUrl,
  preset = "google",
  size = "md",
  className,
}: PlayerAvatarProps) {
  const sizeClass = SIZE_MAP[size];

  // Variante: foto custom subida por el usuario
  if (preset === "custom" && customAvatarDataUrl) {
    return (
      <Avatar className={cn(sizeClass, className)}>
        <AvatarImage src={customAvatarDataUrl} alt={name} />
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
    );
  }

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

  // Default: Google avatar + fallback iniciales
  return (
    <Avatar className={cn(sizeClass, className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}
