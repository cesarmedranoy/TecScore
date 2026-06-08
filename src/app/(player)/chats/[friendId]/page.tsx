/**
 * /chats/[friendId] — conversación 1-a-1 con un amigo.
 *
 * Solo accesible si son amigos confirmados (ACCEPTED).
 */

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { auth } from "@/auth";
import { userRepository, getRelation } from "@/server/repositories";
import { chatService } from "@/server/services/chat-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/gamified/player-avatar";
import { ProfileHoverCard } from "@/components/gamified/profile-hover-card";
import { ChatWindow } from "./_components/chat-window";
import type { AvatarPreset } from "@/types";

interface Props {
  params: Promise<{ friendId: string }>;
}

export default async function ChatPage({ params }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { friendId } = await params;
  const friend = await userRepository.getById(friendId);
  if (!friend) notFound();

  const relation = await getRelation(session.user.userId, friendId);
  if (relation !== "ACCEPTED") {
    return <NotFriendsView />;
  }

  // Cargar mensajes iniciales (después se actualizan por polling)
  const initialMessages = await chatService.listDmMessages(
    session.user.userId,
    friendId,
  );

  const friendPreset = (friend.avatarPreset as AvatarPreset | undefined) ?? "google";

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/chats">
            <ArrowLeft />
          </Link>
        </Button>
        <ProfileHoverCard userId={friend.userId}>
          <div className="flex items-center gap-3 cursor-pointer">
            <PlayerAvatar
              name={friend.displayName}
              avatarUrl={friend.avatarUrl}
              customAvatarDataUrl={friend.customAvatarDataUrl}
              preset={friendPreset}
              size="md"
            />
            <div>
              <p className="font-semibold">
                {friend.displayName}
                <span className="text-muted-foreground font-normal">
                  #{friend.tag}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {friend.totalPoints} pts · Click para ver perfil
              </p>
            </div>
          </div>
        </ProfileHoverCard>
      </div>

      {/* Chat window (client component que maneja mensajes + polling) */}
      <ChatWindow
        friendId={friendId}
        myUserId={session.user.userId}
        initialMessages={initialMessages}
      />
    </div>
  );
}

function NotFriendsView() {
  return (
    <Card>
      <CardContent className="pt-16 pb-16 flex flex-col items-center text-center gap-3">
        <div className="size-16 rounded-full bg-danger/10 flex items-center justify-center text-danger">
          <ShieldAlert className="size-8" />
        </div>
        <h3 className="text-lg font-semibold">No son amigos</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Solo puedes chatear con jugadores que sean tus amigos. Envíales una
          solicitud primero.
        </p>
        <Button asChild>
          <Link href="/amigos">Volver a amigos</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
