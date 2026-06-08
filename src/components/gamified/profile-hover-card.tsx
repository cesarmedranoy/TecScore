/**
 * ProfileHoverCard — preview con stats + últimas apuestas al hover sobre
 * un avatar. Click sobre el footer abre el ProfileModal completo.
 *
 * Cachea el fetch en memoria por userId para no re-pegarle al server.
 */

"use client";

import { useState } from "react";
import { Flame, Trophy, ArrowRight } from "lucide-react";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import { PlayerAvatar } from "./player-avatar";
import { PointsBadge } from "./points-badge";
import { StreakBadge } from "./streak-badge";
import { Badge } from "@/components/ui/badge";
import { ProfileModal } from "./profile-modal";
import { getFlag } from "@/lib/teams/flags";
import type { AvatarPreset } from "@/types";

interface UserPreview {
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
}

interface ApiResponse {
  user: UserPreview;
  recentPredictions: RecentPrediction[];
}

const cache = new Map<string, Promise<ApiResponse>>();

function fetchPreview(userId: string): Promise<ApiResponse> {
  if (!cache.has(userId)) {
    cache.set(
      userId,
      fetch(`/api/users/${userId}/preview`).then((r) => {
        if (!r.ok) throw new Error("Error al cargar perfil");
        return r.json() as Promise<ApiResponse>;
      }),
    );
  }
  return cache.get(userId)!;
}

interface ProfileHoverCardProps {
  userId: string;
  children: React.ReactNode;
}

export function ProfileHoverCard({ userId, children }: ProfileHoverCardProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  async function handleOpenChange(open: boolean) {
    if (open && !data && !error) {
      try {
        const res = await fetchPreview(userId);
        setData(res);
      } catch {
        setError(true);
      }
    }
  }

  return (
    <>
      <HoverCard openDelay={400} closeDelay={200} onOpenChange={handleOpenChange}>
        <HoverCardTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            onClick={() => setModalOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setModalOpen(true);
            }}
            className="cursor-pointer inline-block transition-transform hover:scale-[1.02]"
          >
            {children}
          </span>
        </HoverCardTrigger>
        <HoverCardContent className="w-96 p-0 overflow-hidden">
          {!data && !error && <PreviewSkeleton />}
          {error && (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No se pudo cargar el perfil
            </div>
          )}
          {data && (
            <PreviewContent
              data={data}
              onOpenFull={() => setModalOpen(true)}
            />
          )}
        </HoverCardContent>
      </HoverCard>

      <ProfileModal
        userId={userId}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}

function PreviewContent({
  data,
  onOpenFull,
}: {
  data: ApiResponse;
  onOpenFull: () => void;
}) {
  const { user, recentPredictions } = data;

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-800 p-4 text-white">
        <div className="absolute -right-8 -top-8 size-24 rounded-full bg-amber-400/20 blur-2xl" />
        <div className="relative flex items-center gap-3">
          <PlayerAvatar
            name={user.displayName}
            avatarUrl={user.avatarUrl}
            customAvatarDataUrl={user.customAvatarDataUrl}
            preset={user.avatarPreset}
            size="lg"
            className="ring-2 ring-white/30"
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base truncate">
              {user.displayName}
              <span className="font-normal text-emerald-100">
                #{user.tag}
              </span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <PointsBadge points={user.totalPoints} size="sm" />
              {user.currentStreak > 0 && (
                <StreakBadge streak={user.currentStreak} size="sm" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-2 gap-2 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-amber-500" />
          <div className="text-xs">
            <p className="text-muted-foreground">Récord racha</p>
            <p className="font-semibold">{user.maxStreak} aciertos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="size-4 text-orange-500" />
          <div className="text-xs">
            <p className="text-muted-foreground">Predicciones</p>
            <p className="font-semibold">
              {recentPredictions.length > 0 ? "Activo" : "Sin actividad"}
            </p>
          </div>
        </div>
      </div>

      {/* Últimas apuestas */}
      <div className="px-4 py-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Últimas apuestas
        </h4>
        {recentPredictions.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">
            Aún sin predicciones
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {recentPredictions.map((p) => (
              <li
                key={p.matchId}
                className="flex items-center gap-2 text-xs py-1"
              >
                <span className="text-base">{getFlag(p.homeTeam)}</span>
                <span className="font-mono font-semibold tabular-nums">
                  {p.homeScore}-{p.awayScore}
                </span>
                <span className="text-base">{getFlag(p.awayTeam)}</span>
                <span className="flex-1 truncate text-muted-foreground text-[10px]">
                  {p.homeTeam.slice(0, 3).toUpperCase()} vs{" "}
                  {p.awayTeam.slice(0, 3).toUpperCase()}
                </span>
                {p.status === "FINISHED" && (
                  <Badge
                    variant={p.pointsEarned > 0 ? "accent" : "muted"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {p.pointsEarned > 0 ? `+${p.pointsEarned}` : "0"}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer clickable */}
      <button
        type="button"
        onClick={onOpenFull}
        className="px-4 py-2.5 border-t border-border bg-muted/30 text-xs font-medium hover:bg-muted/60 transition-colors flex items-center justify-center gap-1 text-primary"
      >
        Ver perfil completo
        <ArrowRight className="size-3" />
      </button>
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="bg-muted h-20 animate-pulse" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        <div className="h-3 w-full bg-muted rounded animate-pulse" />
        <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}
