/**
 * /perfil — pantalla de edición de perfil.
 *
 * Permite cambiar:
 *  - Nombre para mostrar (DisplayName)
 *  - Avatar (foto Google, copa del Mundial o bandera de selección)
 *
 * El email y el tag NO se editan — vienen de Google y del ULID.
 */

import { redirect } from "next/navigation";
import { Mail, Hash, Calendar, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { userRepository } from "@/server/repositories";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlayerAvatar } from "@/components/gamified/player-avatar";
import { PointsBadge } from "@/components/gamified/points-badge";
import { StreakBadge } from "@/components/gamified/streak-badge";
import { AvatarPicker } from "./_components/avatar-picker";
import { DisplayNameForm } from "./_components/display-name-form";
import type { AvatarPreset } from "@/types";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await userRepository.getById(session.user.userId);
  if (!user) redirect("/login");

  const preset: AvatarPreset =
    (user.avatarPreset as AvatarPreset | undefined) ?? "google";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi perfil</h1>
        <p className="text-muted-foreground mt-1">
          Personaliza tu identidad en TecScore.
        </p>
      </div>

      {/* Preview del perfil */}
      <Card elevation="glow">
        <CardContent className="pt-6 pb-6 flex items-center gap-6 flex-wrap">
          <PlayerAvatar
            name={user.displayName}
            avatarUrl={user.avatarUrl}
            preset={preset}
            size="xl"
          />
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <div className="flex items-baseline gap-0 flex-wrap">
              <h2 className="text-2xl font-bold">{user.displayName}</h2>
              <span className="text-xl text-muted-foreground font-medium">
                #{user.tag}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <PointsBadge points={user.totalPoints} />
              {user.currentStreak > 0 && (
                <StreakBadge streak={user.currentStreak} />
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-xs text-muted-foreground">
              <InfoRow icon={Mail} label="Email" value={user.email} />
              <InfoRow icon={Hash} label="Tag" value={`#${user.tag}`} />
              <InfoRow
                icon={Calendar}
                label="Desde"
                value={new Date(user.createdAt).toLocaleDateString("es-PE", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editar nombre */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Nombre para mostrar</CardTitle>
          <CardDescription>
            Cómo aparecerás en rankings y chats. Tu tag #{user.tag} no cambia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DisplayNameForm currentName={user.displayName} />
        </CardContent>
      </Card>

      {/* Selector de avatar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            Elige tu avatar
          </CardTitle>
          <CardDescription>
            Mostrá tu identidad con la bandera de tu selección favorita o el
            trofeo del Mundial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarPicker
            userName={user.displayName}
            googleAvatarUrl={user.avatarUrl}
            current={preset}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 truncate">
      <Icon className="size-3 shrink-0" />
      <span className="font-medium">{label}:</span>
      <span className="truncate">{value}</span>
    </div>
  );
}
