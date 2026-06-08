/**
 * /ranking — ranking global de todos los jugadores de TecScore.
 *
 * Top 3 con podio + tabla con el resto. Resaltamos tu propia posición.
 * Se recalcula en cada request (server-side) — para "tiempo real" usaremos
 * Pusher en Fase 6.
 */

import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { auth } from "@/auth";
import { ddb } from "@/lib/aws/client";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { TABLES } from "@/lib/aws/tables";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "@/components/gamified/player-avatar";
import { PointsBadge } from "@/components/gamified/points-badge";
import { StreakBadge } from "@/components/gamified/streak-badge";
import { ProfileHoverCard } from "@/components/gamified/profile-hover-card";
import { cn } from "@/lib/utils";
import type { AvatarPreset, User } from "@/types";

export const dynamic = "force-dynamic";

export default async function RankingGlobalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const res = await ddb.send(new ScanCommand({ TableName: TABLES.USERS }));
  const users = ((res.Items as User[]) ?? [])
    .filter((u) => u.role === "PLAYER") // los admins no compiten
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const myPosition =
    users.findIndex((u) => u.userId === session.user.userId) + 1;
  const me = users.find((u) => u.userId === session.user.userId);

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 p-6 text-white">
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <Badge className="self-start bg-white/15 text-white border-white/20">
              Mundial 2026 — Ranking global
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Trophy className="size-7" />
              Top de TecScore
            </h1>
            <p className="text-amber-100">
              {users.length} jugadores compitiendo en todo el sistema.
            </p>
          </div>
          {me && myPosition > 0 && (
            <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-5 py-3 flex flex-col items-center">
              <span className="text-xs uppercase tracking-wider text-amber-100">
                Tu posición
              </span>
              <span className="text-4xl font-bold tabular-nums">
                #{myPosition}
              </span>
              <span className="text-xs text-amber-100">
                {me.totalPoints} pts
              </span>
            </div>
          )}
        </div>
      </section>

      {users.length === 0 ? (
        <Card>
          <CardContent className="pt-16 pb-16 flex flex-col items-center text-center gap-3">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Trophy className="size-8" />
            </div>
            <h3 className="text-lg font-semibold">Aún no hay jugadores</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              ¡Tú eres el primero! Predice partidos para subir al podio.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 flex flex-col gap-1">
            {users.map((u, idx) => {
              const position = idx + 1;
              const isMe = u.userId === session.user.userId;
              const preset =
                (u.avatarPreset as AvatarPreset | undefined) ?? "google";
              const medal =
                position === 1
                  ? "text-amber-500"
                  : position === 2
                    ? "text-zinc-400"
                    : position === 3
                      ? "text-orange-600"
                      : "text-muted-foreground";
              return (
                <ProfileHoverCard key={u.userId} userId={u.userId}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/40 transition-colors",
                      isMe && "bg-primary/5 border border-primary/20",
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums w-8 text-center",
                        medal,
                      )}
                    >
                      #{position}
                    </span>
                    <PlayerAvatar
                      name={u.displayName}
                      avatarUrl={u.avatarUrl}
                      customAvatarDataUrl={u.customAvatarDataUrl}
                      preset={preset}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-0">
                        <span className="font-medium truncate">
                          {u.displayName}
                        </span>
                        <span className="text-muted-foreground">#{u.tag}</span>
                        {isMe && (
                          <Badge variant="default" className="ml-2">
                            Tú
                          </Badge>
                        )}
                      </div>
                    </div>
                    <StreakBadge streak={u.currentStreak} size="sm" />
                    <PointsBadge points={u.totalPoints} size="sm" />
                  </div>
                </ProfileHoverCard>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
