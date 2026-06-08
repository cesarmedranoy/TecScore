/**
 * Server actions del chat grupal.
 *
 * Guarda en: src/app/(player)/mis-grupos/[groupId]/actions-chat.ts
 */

"use server";

import { auth } from "@/auth";
import {
  groupMemberRepository,
  userRepository,
  notificationRepository,
  buildNotification,
  groupRepository,
} from "@/server/repositories";
import { chatMessageRepository } from "@/server/repositories/chat-message-repository";
import { newId, now } from "@/lib/utils";
import type { ChatMessage } from "@/types";

export interface GroupChatActionState {
  error?: string;
  ok?: boolean;
}

export async function sendGroupMessageAction(
  groupId: string,
  text: string,
): Promise<GroupChatActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const trimmed = text.trim();
  if (!trimmed) return { error: "Mensaje vacío" };
  if (trimmed.length > 500) return { error: "Máximo 500 caracteres" };

  // Verificar que es miembro
  const isMember = await groupMemberRepository.isMember(
    groupId,
    session.user.userId,
  );
  if (!isMember) return { error: "No eres miembro de este grupo" };

  const [sender, group] = await Promise.all([
    userRepository.getById(session.user.userId),
    groupRepository.getById(groupId),
  ]);
  if (!sender) return { error: "Usuario no encontrado" };

  const groupName = group?.name ?? "tu grupo";

  // Guardar mensaje
  const channelId = `g_${groupId}`;
  const message: ChatMessage = {
    groupId: channelId,
    messageId: newId(),
    userId: session.user.userId,
    userName: sender.displayName,
    userAvatar: sender.avatarUrl,
    text: trimmed,
    createdAt: now(),
  };
  await chatMessageRepository.send(message);

  // Notificar a todos los miembros excepto al que envió (silent fail)
  try {
    const members = await groupMemberRepository.listByGroup(groupId);
    const others = members.filter((m) => m.userId !== session.user.userId);

    await Promise.all(
      others.map(async (m) => {
        const notif = buildNotification({
          userId: m.userId,
          type: "ADMIN_MESSAGE",
          title: `Nuevo mensaje en ${groupName}`,
          body: `${sender.displayName}: ${trimmed.length > 60 ? trimmed.slice(0, 60) + "…" : trimmed}`,
          metadata: {
            groupId,
            groupName,
            link: `/mis-grupos/${groupId}/chat`,
          },
        });
        notif.notifId = newId();
        await notificationRepository.create(notif);
      }),
    );
  } catch (err) {
    console.warn("[group-chat] no se pudo notificar:", err);
  }

  return { ok: true };
}