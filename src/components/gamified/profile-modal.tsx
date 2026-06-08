/**
 * ProfileModal — vista completa del perfil de un jugador.
 *
 * Se abre al hacer click sobre el footer del ProfileHoverCard.
 * Carga el preview al abrirse (cache compartido).
 *
 * Acciones disponibles según `relation`:
 *  - NONE              → botón "Agregar amigo"
 *  - PENDING_SENT      → botón "Cancelar solicitud"
 *  - PENDING_RECEIVED  → botones "Aceptar" / "Rechazar"
 *  - ACCEPTED          → botón "Eliminar amistad" + indicador "Amigos ✓"
 *  - SELF              → ningún botón (es uno mismo)
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Flame,
  Trophy,
  UserPlus,
  UserCheck,
  UserMinus,
  X,
  Check,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayerAvatar } from "./player-avatar";
import { PointsBadge } from "./points-badge";
import { StreakBadge } from "./streak-badge";
import { getFlag } from "@/lib/teams/flags";
import {
  sendFriendRequestAction,
  acceptFriendRequestAction,
  rejectOrCancelFriendAction,
  removeFriendAction,
} from "@/app/(player)/amigos/actions";
import type { AvatarPreset, FriendshipRelation } from "@/types";

interface UserData {
  userId: string;
  displayName: string;
  tag: string;
  avatarUrl: string;
  avatarPreset: AvatarPreset;
  customAvatarDataUrl?: string;
  totalPoints: number;
  currentStreak: number;
  maxStreak: number;
  createdAt: string;
}

interface RecentPrediction {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  actualHome?: number;
  actualAway?: number;
  status: string;
  pointsEarned: number;
  kickoffAt: string;
}

interface ProfileModalProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileModal({ userId, open, onOpenChange }: ProfileModalProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [predictions, setPredictions] = useState<RecentPrediction[]>([]);
  const [relation, setRelation] = useState<FriendshipRelation>("NONE");
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/users/${userId}/preview`)
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setPredictions(data.recentPredictions);
      })
      .finally(() => setLoading(false));

    fetch(`/api/users/${userId}/relation`)
      .then((r) => r.json())
      .then((data: { relation: FriendshipRelation }) => {
        setRelation(data.relation);
      })
      .catch(() => setRelation("NONE"));
  }, [userId, open]);

  function refreshRelation() {
    fetch(`/api/users/${userId}/relation`)
      .then((r) => r.json())
      .then((data: { relation: FriendshipRelation }) => {
        setRelation(data.relation);
      });
  }

  function handleSendRequest() {
    startTransition(async () => {
      const res = await sendFriendRequestAction(userId);
      if (res.error) toast.error(res.error);
      else {
        toast.success(res.success ?? "Solicitud enviada");
        refreshRelation();
      }
    });
  }

  function handleAccept() {
    startTransition(async () => {
      const res = await acceptFriendRequestAction(userId);
      if (res.error) toast.error(res.error);
      else {
        toast.success(res.success ?? "¡Ahora son amigos!");
        refreshRelation();
      }
    });
  }

  function handleRejectOrCancel() {
    startTransition(async () => {
      const res = await rejectOrCancelFriendAction(userId);
      if (res.error) toast.error(res.error);
      else {
        toast.success(res.success ?? "Cancelado");
        refreshRelation();
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const res = await removeFriendAction(userId);
      if (res.error) toast.error(res.error);
      else {
        toast.success(res.success ?? "Amistad eliminada");
        refreshRelation();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Perfil de jugador</DialogTitle>
        </DialogHeader>

        {loading || !user ? (
          <ProfileSkeleton />
        ) : (
          <div className="flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Hero */}
            <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 p-6 text-white">
              <div className="absolute -right-12 -top-12 size-48 rounded-full bg-amber-400/20 blur-3xl" />
              <div className="absolute -left-12 -bottom-12 size-48 rounded-full bg-emerald-300/20 blur-3xl" />
              <div className="relative flex items-start gap-4">
                <PlayerAvatar
                  name={user.displayName}
                  avatarUrl={user.avatarUrl}
                  customAvatarDataUrl={user.customAvatarDataUrl}
                  preset={user.avatarPreset}
                  size="xl"
                  className="ring-4 ring-white/30 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold tracking-tight truncate">
                    {user.displayName}
                    <span className="font-normal text-emerald-100">
                      #{user.tag}
                    </span>
                  </h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <PointsBadge points={user.totalPoints} />
                    {user.currentStreak > 0 && (
                      <StreakBadge streak={user.currentStreak} />
                    )}
                  </div>
                  <p className="text-xs text-emerald-100 mt-2 flex items-center gap-1">
                    <Calendar className="size-3" />
                    Miembro desde{" "}
                    {new Date(user.createdAt).toLocaleDateString("es-PE", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Acciones de amistad */}
            <div className="px-6 py-4 border-b border-border">
              <FriendshipActions
                relation={relation}
                onSend={handleSendRequest}
                onAccept={handleAccept}
                onReject={handleRejectOrCancel}
                onRemove={handleRemove}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-border">
              <StatBox
                icon={Trophy}
                label="Puntos"
                value={user.totalPoints.toLocaleString("es-PE")}
                color="amber"
              />
              <StatBox
                icon={Flame}
                label="Racha actual"
                value={String(user.currentStreak)}
                color="orange"
              />
              <StatBox
                icon={Trophy}
                label="Récord racha"
                value={String(user.maxStreak)}
                color="emerald"
              />
            </div>

            {/* Últimas apuestas */}
            <div className="px-6 py-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Últimas apuestas ({predictions.length})
              </h3>
              {predictions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Aún sin predicciones
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {predictions.map((p) => (
                    <li
                      key={p.matchId}
                      className="flex items-center gap-3 p-2.5 rounded-md bg-muted/40"
                    >
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-xl">
                          {getFlag(p.homeTeam)}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {p.homeTeam}
                        </span>
                      </div>
                      <div className="flex flex-col items-center text-xs">
                        <span className="font-mono font-bold tabular-nums">
                          {p.homeScore} - {p.awayScore}
                        </span>
                        {p.actualHome !== undefined &&
                          p.actualAway !== undefined && (
                            <span className="text-[10px] text-muted-foreground">
                              real: {p.actualHome}-{p.actualAway}
                            </span>
                          )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                        <span className="text-sm font-medium truncate">
                          {p.awayTeam}
                        </span>
                        <span className="text-xl">
                          {getFlag(p.awayTeam)}
                        </span>
                      </div>
                      {p.status === "FINISHED" && (
                        <Badge
                          variant={p.pointsEarned > 0 ? "accent" : "muted"}
                          className="shrink-0"
                        >
                          {p.pointsEarned > 0 ? `+${p.pointsEarned}` : "0"}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FriendshipActions({
  relation,
  onSend,
  onAccept,
  onReject,
  onRemove,
}: {
  relation: FriendshipRelation;
  onSend: () => void;
  onAccept: () => void;
  onReject: () => void;
  onRemove: () => void;
}) {
  if (relation === "SELF") {
    return (
      <p className="text-xs text-muted-foreground text-center">
        Este es tu propio perfil
      </p>
    );
  }
  if (relation === "ACCEPTED") {
    return (
      <div className="flex items-center justify-between gap-2">
        <Badge variant="default" className="gap-1.5">
          <UserCheck className="size-3" />
          Son amigos
        </Badge>
        <Button variant="outline" size="sm" onClick={onRemove}>
          <UserMinus />
          Eliminar amistad
        </Button>
      </div>
    );
  }
  if (relation === "PENDING_SENT") {
    return (
      <div className="flex items-center justify-between gap-2">
        <Badge variant="muted" className="gap-1.5">
          <UserPlus className="size-3" />
          Solicitud enviada
        </Badge>
        <Button variant="outline" size="sm" onClick={onReject}>
          <X />
          Cancelar
        </Button>
      </div>
    );
  }
  if (relation === "PENDING_RECEIVED") {
    return (
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Badge variant="accent" className="gap-1.5">
          Te envió solicitud
        </Badge>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onReject}>
            <X />
            Rechazar
          </Button>
          <Button size="sm" onClick={onAccept}>
            <Check />
            Aceptar
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <Button onClick={onSend}>
        <UserPlus />
        Agregar amigo
      </Button>
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: "amber" | "orange" | "emerald";
}) {
  const colors = {
    amber: "text-amber-600 dark:text-amber-400",
    orange: "text-orange-600 dark:text-orange-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
  } as const;
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/40">
      <Icon className={`size-5 ${colors[color]}`} />
      <span className="text-xl font-bold tabular-nums">{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="bg-muted h-32 animate-pulse" />
      <div className="p-6 flex flex-col gap-3">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}
