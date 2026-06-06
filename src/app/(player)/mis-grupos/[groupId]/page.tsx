/**
 * /mis-grupos/[groupId] — detalle del grupo con ranking.
 *
 * Acceso restringido: solo miembros del grupo (o admin del sistema).
 * Si no sos miembro → 403 visual con CTA para volver.
 */

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Lock,
  Globe,
  Users,
  Medal,
} from "lucide-react";
import { auth } from "@/auth";
import {
  groupRepository,
  groupMemberRepository,
  groupRequestRepository,
  userRepository,
} from "@/server/repositories";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage, getInitials } from "@/components/ui/avatar";
import { PointsBadge } from "@/components/gamified/points-badge";
import { StreakBadge } from "@/components/gamified/streak-badge";
import { GroupActions } from "./_components/group-actions";
import { PendingRequests } from "./_components/pending-requests";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { groupId } = await params;
  const group = await groupRepository.getById(groupId);
  if (!group) notFound();

  const isMember = await groupMemberRepository.isMember(
    groupId,
    session.user.userId,
  );
  if (!isMember && session.user.role !== "ADMIN") {
    return <ForbiddenView />;
  }

  const isOwner = group.ownerId === session.user.userId;

  // Construir ranking
  const members = await groupMemberRepository.listByGroup(groupId);
  const enriched = await Promise.all(
    members.map(async (m) => {
      const user = await userRepository.getById(m.userId);
      return user ? { ...user, joinedAt: m.joinedAt } : null;
    }),
  );
  const ranking = enriched
    .filter((u): u is NonNullable<typeof u> => u !== null)
    .sort((a, b) => b.totalPoints - a.totalPoints);

  const myPosition =
    ranking.findIndex((u) => u.userId === session.user.userId) + 1;

  // Solicitudes pendientes (solo owner las ve)
  const pendingRequests = isOwner
    ? await groupRequestRepository.listPendingByGroup(groupId)
    : [];
  const enrichedRequests = await Promise.all(
    pendingRequests.map(async (r) => {
      const u = await userRepository.getById(r.userId);
      if (!u) return null;
      return {
        ...r,
        requester: {
          userId: u.userId,
          displayName: u.displayName,
          tag: u.tag,
          avatarUrl: u.avatarUrl,
        },
      };
    }),
  );
  const validRequests = enrichedRequests.filter(
    (r): r is NonNullable<typeof r> => r !== null,
  );

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/mis-grupos"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="size-4" />
        Volver a mis grupos
      </Link>

      {/* Hero del grupo */}
      <section className="rounded-2xl border border-border bg-card p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
              {isOwner && (
                <Badge variant="accent">
                  <Crown className="size-3" />
                  Sos owner
                </Badge>
              )}
            </div>
            {group.description && (
              <p className="text-muted-foreground max-w-2xl">
                {group.description}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Badge variant={group.visibility === "PRIVATE" ? "muted" : "outline"}>
                {group.visibility === "PRIVATE" ? (
                  <>
                    <Lock className="size-3" />
                    Privado
                  </>
                ) : (
                  <>
                    <Globe className="size-3" />
                    Público
                  </>
                )}
              </Badge>
              <Badge variant="muted">
                <Users className="size-3" />
                {group.memberCount} / {group.maxMembers} miembros
              </Badge>
              {myPosition > 0 && (
                <Badge variant="default">Vas #{myPosition}</Badge>
              )}
            </div>
          </div>
          <GroupActions
            groupId={group.groupId}
            isOwner={isOwner}
            joinCode={group.joinCode}
          />
        </div>
      </section>

      {/* Solicitudes pendientes (solo owner) */}
      {isOwner && validRequests.length > 0 && (
        <PendingRequests groupId={group.groupId} requests={validRequests} />
      )}

      {/* Ranking */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Ranking del grupo
          </h2>
          <span className="text-sm text-muted-foreground">
            {ranking.length} jugadores
          </span>
        </div>

        {/* Podio (top 3) */}
        {ranking.length >= 1 && (
          <div className="grid grid-cols-3 gap-3">
            {[ranking[1], ranking[0], ranking[2]]
              .filter(Boolean)
              .map((user, displayIdx) => {
                const realPosition =
                  displayIdx === 0 ? 2 : displayIdx === 1 ? 1 : 3;
                return (
                  <PodiumCard
                    key={user!.userId}
                    user={user!}
                    position={realPosition}
                    isMe={user!.userId === session.user.userId}
                  />
                );
              })}
          </div>
        )}

        {/* Resto del ranking */}
        {ranking.length > 3 && (
          <Card>
            <CardContent className="pt-6 flex flex-col gap-2">
              {ranking.slice(3).map((user, idx) => {
                const position = idx + 4;
                const isMe = user.userId === session.user.userId;
                return (
                  <div
                    key={user.userId}
                    className={cn(
                      "flex items-center gap-4 px-3 py-2 rounded-md",
                      isMe && "bg-primary/5 border border-primary/20",
                    )}
                  >
                    <span className="text-sm font-bold text-muted-foreground tabular-nums w-6">
                      #{position}
                    </span>
                    <Avatar className="size-9">
                      {user.avatarUrl && (
                        <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                      )}
                      <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-0">
                        <span className="font-medium truncate">
                          {user.displayName}
                        </span>
                        <span className="text-muted-foreground">
                          #{user.tag}
                        </span>
                      </div>
                    </div>
                    <StreakBadge streak={user.currentStreak} size="sm" />
                    <PointsBadge points={user.totalPoints} size="sm" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

// ============================================================================
// Subcomponentes
// ============================================================================

function PodiumCard({
  user,
  position,
  isMe,
}: {
  user: { userId: string; displayName: string; tag: string; avatarUrl: string; totalPoints: number; currentStreak: number };
  position: 1 | 2 | 3;
  isMe: boolean;
}) {
  const heights = { 1: "h-44", 2: "h-36", 3: "h-32" } as const;
  const medals = {
    1: "text-amber-500",
    2: "text-zinc-400",
    3: "text-orange-700",
  } as const;
  const ring = {
    1: "ring-amber-400",
    2: "ring-zinc-300",
    3: "ring-orange-400",
  } as const;

  return (
    <div className="flex flex-col items-center gap-2 mt-auto">
      <Avatar
        className={cn(
          "size-16 ring-4",
          ring[position],
          isMe && "ring-offset-2 ring-offset-background",
        )}
      >
        {user.avatarUrl && (
          <AvatarImage src={user.avatarUrl} alt={user.displayName} />
        )}
        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
      </Avatar>
      <div className="text-center min-w-0 max-w-full">
        <p className="font-semibold truncate text-sm">
          {user.displayName}
          <span className="text-muted-foreground font-normal">
            #{user.tag}
          </span>
        </p>
        <PointsBadge points={user.totalPoints} size="sm" className="mt-1" />
      </div>
      <Card
        elevation={position === 1 ? "glow" : "raised"}
        className={cn(
          "w-full flex flex-col items-center justify-end px-3 pt-3 pb-4 gap-1 rounded-t-lg rounded-b-none",
          heights[position],
        )}
      >
        <Medal className={cn("size-7", medals[position])} />
        <span className={cn("text-3xl font-bold tabular-nums", medals[position])}>
          {position}
        </span>
      </Card>
    </div>
  );
}

function ForbiddenView() {
  return (
    <Card>
      <CardContent className="pt-16 pb-16 flex flex-col items-center text-center gap-4">
        <div className="size-16 rounded-full bg-danger/10 flex items-center justify-center text-danger">
          <Lock className="size-8" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Este grupo es privado</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Pedile al owner que te invite o que apruebe tu solicitud.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/mis-grupos">Volver a mis grupos</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
