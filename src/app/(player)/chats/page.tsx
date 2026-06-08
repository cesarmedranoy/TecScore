/**
 * /chats — lista de conversaciones con amigos.
 *
 * Cada amigo es una conversación potencial. Mostramos avatar grande
 * para identificación rápida + invitación a chatear.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare, UserPlus } from "lucide-react";
import { auth } from "@/auth";
import { friendshipService } from "@/server/services/friendship-service";
import { userRepository } from "@/server/repositories";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/gamified/player-avatar";
import type { AvatarPreset } from "@/types";

export default async function ChatsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const friendIds = await friendshipService.listFriends(session.user.userId);
  const friends = (
    await Promise.all(friendIds.map((id) => userRepository.getById(id)))
  ).filter((u): u is NonNullable<typeof u> => u !== null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="size-7" />
            Chats
          </h1>
          <p className="text-muted-foreground mt-1">
            Conversaciones privadas con tus amigos.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/amigos">
            <UserPlus />
            Gestionar amigos
          </Link>
        </Button>
      </div>

      {friends.length === 0 ? (
        <Card>
          <CardContent className="pt-16 pb-16 flex flex-col items-center text-center gap-3">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <MessageSquare className="size-8" />
            </div>
            <h3 className="text-lg font-semibold">Aún no tienes con quién chatear</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Solo puedes chatear con amigos. Primero busca jugadores y envíales
              solicitud de amistad.
            </p>
            <Button asChild>
              <Link href="/buscar">
                <UserPlus />
                Buscar jugadores
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col gap-1">
            {friends.map((u) => {
              const preset =
                (u.avatarPreset as AvatarPreset | undefined) ?? "google";
              return (
                <Link
                  key={u.userId}
                  href={`/chats/${u.userId}`}
                  className="flex items-center gap-3 px-3 py-3 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  <PlayerAvatar
                    name={u.displayName}
                    avatarUrl={u.avatarUrl}
                    customAvatarDataUrl={u.customAvatarDataUrl}
                    preset={preset}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {u.displayName}
                      <span className="text-muted-foreground font-normal">
                        #{u.tag}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click para abrir conversación
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    Chatear →
                  </span>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
