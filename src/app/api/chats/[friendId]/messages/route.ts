/**
 * GET /api/chats/:friendId/messages
 *
 * Devuelve los mensajes recientes del DM con :friendId.
 * Solo si son amigos confirmados.
 *
 * Usado por el cliente para polling cada 3s (real-time MVP).
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { chatService } from "@/server/services/chat-service";
import { getRelation } from "@/server/repositories";

interface Ctx {
  params: Promise<{ friendId: string }>;
}

export async function GET(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { friendId } = await params;

  const relation = await getRelation(session.user.userId, friendId);
  if (relation !== "ACCEPTED") {
    return NextResponse.json(
      { error: "Solo puedes ver chats con amigos" },
      { status: 403 },
    );
  }

  const messages = await chatService.listDmMessages(
    session.user.userId,
    friendId,
  );
  return NextResponse.json({ messages });
}
