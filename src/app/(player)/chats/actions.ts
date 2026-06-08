/**
 * Server actions del chat.
 */

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  chatService,
  NotFriendsError,
  MessageTooLongError,
} from "@/server/services/chat-service";

export interface ChatActionState {
  error?: string;
  ok?: boolean;
}

export async function sendDmAction(
  receiverId: string,
  text: string,
): Promise<ChatActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };
  try {
    await chatService.sendDirectMessage({
      senderId: session.user.userId,
      receiverId,
      text,
    });
    revalidatePath(`/chats/${receiverId}`);
    return { ok: true };
  } catch (err) {
    if (err instanceof NotFriendsError) return { error: err.message };
    if (err instanceof MessageTooLongError) return { error: err.message };
    if (err instanceof Error) return { error: err.message };
    throw err;
  }
}
