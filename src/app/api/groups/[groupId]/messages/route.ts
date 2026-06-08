/**
 * API route para polling de mensajes del chat grupal.
 *
 * Guarda en: src/app/api/groups/[groupId]/messages/route.ts
 *
 * GET /api/groups/:groupId/messages
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { groupMemberRepository } from "@/server/repositories";
import { chatMessageRepository } from "@/server/repositories/chat-message-repository";

type Params = { params: Promise<{ groupId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { groupId } = await params;

  // Solo miembros pueden leer el chat
  const isMember = await groupMemberRepository.isMember(
    groupId,
    session.user.userId,
  );
  if (!isMember) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const channelId = `g_${groupId}`;
  const messages = await chatMessageRepository.listByChannel(channelId, 100);
  return NextResponse.json({ messages });
}