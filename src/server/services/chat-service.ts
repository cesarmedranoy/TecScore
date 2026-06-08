/**
 * Chat service — orquesta envío y consulta de mensajes 1-a-1.
 *
 * Reglas:
 *  - Solo amigos confirmados pueden enviarse mensajes
 *  - Mensajes se persisten con avatar denormalizado (para no joinear al render)
 *  - Notificación al receptor cuando llega un mensaje nuevo
 */

import {
  chatMessageRepository,
  makeDmChannelId,
  userRepository,
  notificationRepository,
  buildNotification,
  getRelation,
} from "@/server/repositories";
import { newId, now } from "@/lib/utils";
import type { ChatMessage } from "@/types";

export class NotFriendsError extends Error {
  constructor() {
    super("Solo puedes chatear con tus amigos");
    this.name = "NotFriendsError";
  }
}

export class MessageTooLongError extends Error {
  constructor() {
    super("El mensaje es muy largo (máx 500 caracteres)");
    this.name = "MessageTooLongError";
  }
}

export const MAX_MESSAGE_LENGTH = 500;

export const chatService = {
  async sendDirectMessage(params: {
    senderId: string;
    receiverId: string;
    text: string;
  }): Promise<ChatMessage> {
    const text = params.text.trim();
    if (text.length === 0) throw new Error("Mensaje vacío");
    if (text.length > MAX_MESSAGE_LENGTH) throw new MessageTooLongError();

    // Solo amigos pueden chatear
    const relation = await getRelation(params.senderId, params.receiverId);
    if (relation !== "ACCEPTED") throw new NotFriendsError();

    const sender = await userRepository.getById(params.senderId);
    if (!sender) throw new Error("Sender no existe");

    const channelId = makeDmChannelId(params.senderId, params.receiverId);
    const message: ChatMessage = {
      groupId: channelId,
      messageId: newId(),
      userId: params.senderId,
      userName: sender.displayName,
      userAvatar: sender.avatarUrl,
      text,
      createdAt: now(),
    };
    await chatMessageRepository.send(message);

    // Notificar al receptor (silent fail)
    try {
      const notif = buildNotification({
        userId: params.receiverId,
        type: "ADMIN_MESSAGE",
        title: `${sender.displayName} te envió un mensaje`,
        body: text.length > 80 ? text.slice(0, 80) + "…" : text,
        metadata: { link: `/chats/${params.senderId}` },
      });
      notif.notifId = newId();
      await notificationRepository.create(notif);
    } catch (err) {
      console.warn("[chat] no se pudo notificar mensaje:", err);
    }

    return message;
  },

  /** Lista los mensajes de la conversación entre dos usuarios. */
  async listDmMessages(
    userIdA: string,
    userIdB: string,
    limit = 100,
  ): Promise<ChatMessage[]> {
    const channelId = makeDmChannelId(userIdA, userIdB);
    return chatMessageRepository.listByChannel(channelId, limit);
  },
};
