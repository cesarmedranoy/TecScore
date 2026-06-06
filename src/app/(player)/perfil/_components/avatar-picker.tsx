/**
 * AvatarPicker — UI completa de selección de avatar.
 *
 * Tres secciones:
 *  1. Tu foto (Google) → preset "google"
 *  2. Subir foto custom (con crop circular tipo TikTok)
 *  3. Banderas de selecciones del Mundial
 *
 * Al seleccionar uno: server action persiste + revalidatePath para que
 * el cambio se vea instantáneo en el header.
 */

"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { PlayerAvatar } from "@/components/gamified/player-avatar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { updateAvatarPresetAction } from "../actions";
import { AvatarUploadDialog } from "./avatar-upload-dialog";
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
  customAvatarDataUrl?: string;
  current: AvatarPreset;
}

export function AvatarPicker({
  userName,
  googleAvatarUrl,
  customAvatarDataUrl,
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
        setSelected(current);
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

      {/* Foto personal */}
      <Section
        title="Tu identidad"
        action={<AvatarUploadDialog hasCurrent={!!customAvatarDataUrl} />}
      >
        <Option
          isSelected={selected === "google"}
          onClick={() => pick("google")}
          label="Foto Google"
        >
          <PlayerAvatar
            name={userName}
            avatarUrl={googleAvatarUrl}
            preset="google"
            size="lg"
          />
        </Option>
        {customAvatarDataUrl && (
          <Option
            isSelected={selected === "custom"}
            onClick={() => pick("custom")}
            label="Mi foto"
          >
            <PlayerAvatar
              name={userName}
              customAvatarDataUrl={customAvatarDataUrl}
              preset="custom"
              size="lg"
            />
          </Option>
        )}
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
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </h3>
          {action}
        </div>
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
