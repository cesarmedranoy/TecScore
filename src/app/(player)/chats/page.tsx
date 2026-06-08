/**
 * /chats — mensajería directa con amigos.
 * Próxima fase. Por ahora muestra la lista de amigos y un placeholder.
 */

import { redirect } from "next/navigation";
import { MessageCircle, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { auth } from "@/auth";
import { friendshipService } from "@/server/services/friendship-service";
import { userRepository } from "@/server/repositories";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/gamified/player-avatar";
import { ProfileHoverCard } from "@/components/gamified/profile-hover-card";
import type { AvatarPreset } from "@/types";

export default async function ChatsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const friendIds = await friendshipService.listFriends(session.user.userId);
  const friends = (
    await Promise.all(friendIds.map((id) => userRepository.getById(id)))
  ).filter((u) => u !== null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <MessageCircle className="size-7" />
          Chats
        </h1>
        <p className="text-muted-foreground mt-1">
          Conversa en privado con tus amigos.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 px-4 py-3 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 mb-4">
            <Sparkles className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-900 dark:text-amber-200">
              <strong>Próximamente:</strong> el chat real-time entre amigos se
              activa en la siguiente actualización. Por ahora ves la lista de
              tus amigos disponibles.
            </p>
          </div>

          {friends.length === 0 ? (
            <div className="flex flex-col items-center text-center gap-3 py-10">
              <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Users className="size-8" />
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                Aún no tienes amigos para chatear. Búscalos y envía solicitudes
                desde la sección de búsqueda.
              </p>
              <Button asChild>
                <Link href="/buscar">Buscar jugadores</Link>
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {friends.map((u) => {
                const preset =
                  (u.avatarPreset as AvatarPreset | undefined) ?? "google";
                return (
                  <li
                    key={u.userId}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-md hover:bg-muted/40 transition-colors"
                  >
                    <ProfileHoverCard userId={u.userId}>
                      <div className="flex items-center gap-3 flex-1 cursor-pointer">
                        <PlayerAvatar
                          name={u.displayName}
                          avatarUrl={u.avatarUrl}
                          customAvatarDataUrl={u.customAvatarDataUrl}
                          preset={preset}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {u.displayName}
                            <span className="text-muted-foreground">
                              #{u.tag}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Click para chatear (pronto)
                          </p>
                        </div>
                      </div>
                    </ProfileHoverCard>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      title="Chat próximamente"
                    >
                      <MessageCircle />
                      Abrir
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
