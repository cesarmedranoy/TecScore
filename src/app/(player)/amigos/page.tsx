/**
 * /amigos — gestión de amistades.
 *
 * 3 secciones:
 *  1. Solicitudes recibidas (acción urgente)
 *  2. Mis amigos
 *  3. Solicitudes enviadas (cancelables)
 */

import { redirect } from "next/navigation";
import Link from "next/link";
import { UserPlus, Search, Inbox, Send, Users } from "lucide-react";
import { auth } from "@/auth";
import { friendshipService } from "@/server/services/friendship-service";
import { userRepository } from "@/server/repositories";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FriendListItem } from "./_components/friend-list-item";
import type { AvatarPreset, User } from "@/types";

async function hydrate(userIds: string[]): Promise<User[]> {
  const users = await Promise.all(userIds.map((id) => userRepository.getById(id)));
  return users.filter((u): u is User => u !== null);
}

export default async function AmigosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const myId = session.user.userId;

  const [friends, received, sent] = await Promise.all([
    friendshipService.listFriends(myId).then(hydrate),
    friendshipService.listPendingReceived(myId).then(hydrate),
    friendshipService.listPendingSent(myId).then(hydrate),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="size-7" />
            Mis amigos
          </h1>
          <p className="text-muted-foreground mt-1">
            Conecta con otros jugadores. Pronto podrás chatear con ellos.
          </p>
        </div>
        <Button asChild>
          <Link href="/buscar">
            <Search />
            Buscar jugadores
          </Link>
        </Button>
      </div>

      {/* Solicitudes recibidas */}
      <Section
        icon={Inbox}
        title="Solicitudes recibidas"
        emptyText="No tienes solicitudes pendientes"
        count={received.length}
        highlight
      >
        {received.map((u) => (
          <FriendListItem
            key={u.userId}
            user={{
              userId: u.userId,
              displayName: u.displayName,
              tag: u.tag,
              avatarUrl: u.avatarUrl,
              avatarPreset: (u.avatarPreset as AvatarPreset | undefined) ?? "google",
              customAvatarDataUrl: u.customAvatarDataUrl,
              totalPoints: u.totalPoints,
            }}
            variant="received"
          />
        ))}
      </Section>

      {/* Mis amigos */}
      <Section
        icon={Users}
        title="Mis amigos"
        emptyText="Aún no tienes amigos. Búscalos arriba."
        count={friends.length}
      >
        {friends.map((u) => (
          <FriendListItem
            key={u.userId}
            user={{
              userId: u.userId,
              displayName: u.displayName,
              tag: u.tag,
              avatarUrl: u.avatarUrl,
              avatarPreset: (u.avatarPreset as AvatarPreset | undefined) ?? "google",
              customAvatarDataUrl: u.customAvatarDataUrl,
              totalPoints: u.totalPoints,
            }}
            variant="friend"
          />
        ))}
      </Section>

      {/* Solicitudes enviadas */}
      <Section
        icon={Send}
        title="Solicitudes enviadas"
        emptyText="No has enviado solicitudes"
        count={sent.length}
      >
        {sent.map((u) => (
          <FriendListItem
            key={u.userId}
            user={{
              userId: u.userId,
              displayName: u.displayName,
              tag: u.tag,
              avatarUrl: u.avatarUrl,
              avatarPreset: (u.avatarPreset as AvatarPreset | undefined) ?? "google",
              customAvatarDataUrl: u.customAvatarDataUrl,
              totalPoints: u.totalPoints,
            }}
            variant="sent"
          />
        ))}
      </Section>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  emptyText,
  count,
  highlight = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  emptyText: string;
  count: number;
  highlight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="font-semibold">{title}</h2>
        {count > 0 && (
          <Badge variant={highlight ? "accent" : "muted"}>{count}</Badge>
        )}
      </div>
      <Card>
        <CardContent className="pt-4 pb-4">
          {count === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {emptyText}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">{children}</ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
