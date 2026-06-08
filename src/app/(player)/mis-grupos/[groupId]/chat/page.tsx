/**
 * /mis-grupos/[groupId]/chat — chat grupal a pantalla completa.
 *
 * Guarda en: src/app/(player)/mis-grupos/[groupId]/chat/page.tsx
 */

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { auth } from "@/auth";
import {
  groupRepository,
  groupMemberRepository,
} from "@/server/repositories";
import { chatMessageRepository } from "@/server/repositories/chat-message-repository";
import { GroupChat } from "../_components/GroupChat";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ groupId: string }>;
}

export default async function GroupChatPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { groupId } = await params;
  const group = await groupRepository.getById(groupId);
  if (!group) notFound();

  const isMember = await groupMemberRepository.isMember(
    groupId,
    session.user.userId,
  );
  if (!isMember) redirect(`/mis-grupos/${groupId}`);

  const channelId = `g_${groupId}`;
  const initialMessages = await chatMessageRepository.listByChannel(channelId, 100);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-120px)]">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/mis-grupos/${groupId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            Volver al grupo
          </Link>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg tracking-tight">{group.name}</h1>
            <Badge variant="muted">
              <Users className="size-3" />
              {group.memberCount} miembros
            </Badge>
          </div>
        </div>
      </div>

      {/* Chat ocupa el resto de la altura */}
      <div className="flex-1 min-h-0">
        <GroupChat
          groupId={groupId}
          myUserId={session.user.userId}
          initialMessages={initialMessages}
          fullHeight
        />
      </div>
    </div>
  );
}