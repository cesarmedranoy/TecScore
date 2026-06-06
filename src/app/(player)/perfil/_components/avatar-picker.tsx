/**
 * AvatarPicker — grid de opciones de avatar.
 *
 * El usuario elige entre:
 *  - "google": su foto Google
 *  - "cup":    el escudo del Mundial
 *  - "flag:X": banderas de selecciones (12+ países)
 *
 * Al hacer click sobre uno: server action guarda + se ve el cambio
 * instantáneo (revalidatePath actualiza dashboard también).
 */

"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { PlayerAvatar } from "@/components/gamified/player-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { updateAvatarPresetAction } from "../actions";
import type { AvatarPreset } from "@/types";

const FLAG_OPTIONS: string[] = [
  "Perú",
  "Argentina",
  "Brasil",
  "Colombia",
  "Chile",
  "Uruguay",
  "México",
  "España",
  "Francia",
  "Inglaterra",
  "Alemania",
  "Italia",
  "Portugal",
  "Japón",
  "Marruecos",
  "Croacia",
];

interface AvatarPickerProps {
  userName: string;
  googleAvatarUrl?: string;
  current: AvatarPreset;
}

export function AvatarPicker({
  userName,
  googleAvatarUrl,
  current,
}: AvatarPickerProps) {
  const [selected, setSelected] = useState<AvatarPreset>(current);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function pick(preset: AvatarPreset) {
    if (selected === preset) return;
    setSelected(preset);
    setError(null);
    startTransition(async () => {
      const res = await updateAvatarPresetAction(preset);
      if (res.error) {
        setError(res.error);
        setSelected(current); // revertir
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Foto Google + Copa */}
      <Section title="Identidad">
        <Option
          isSelected={selected === "google"}
          onClick={() => pick("google")}
          label="Tu foto"
        >
          <PlayerAvatar
            name={userName}
            avatarUrl={googleAvatarUrl}
            preset="google"
            size="lg"
          />
        </Option>
        <Option
          isSelected={selected === "cup"}
          onClick={() => pick("cup")}
          label="Copa Mundial"
        >
          <PlayerAvatar name={userName} preset="cup" size="lg" />
        </Option>
      </Section>

      {/* Banderas */}
      <Section title="Banderas de selecciones">
        {FLAG_OPTIONS.map((country) => {
          const preset = `flag:${country}` as AvatarPreset;
          return (
            <Option
              key={country}
              isSelected={selected === preset}
              onClick={() => pick(preset)}
              label={country}
            >
              <PlayerAvatar
                name={userName}
                preset={preset}
                size="lg"
              />
            </Option>
          );
        })}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

function Option({
  isSelected,
  onClick,
  label,
  children,
}: {
  isSelected: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all",
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-transparent hover:border-border hover:bg-muted",
      )}
    >
      <div className="relative">
        {children}
        {isSelected && (
          <div className="absolute -top-1 -right-1 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md">
            <Check className="size-4" />
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-center truncate w-full">
        {label}
      </span>
    </button>
  );
}
