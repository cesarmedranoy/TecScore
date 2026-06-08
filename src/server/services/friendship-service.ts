/**
 * Friendship service — orquesta amistades + dispara notificaciones.
 *
 * Reglas:
 *  - No puedes enviarte solicitud a ti mismo
 *  - No puedes enviar si ya hay una activa (en cualquier estado)
 *  - Solo el receptor puede aceptar/rechazar
 *  - Quien envió puede cancelar (igual a rechazar)
 *  - Cualquiera de los dos puede eliminar amistad ya aceptada
 */

import {
  friendshipRepository,
  notificationRepository,
  userRepository,
  buildNotification,
} from "@/server/repositories";
import { newId } from "@/lib/utils";

export class CannotFriendSelfError extends Error {
  constructor() {
    super("No puedes enviarte solicitud a ti mismo");
    this.name = "CannotFriendSelfError";
  }
}

export class AlreadyFriendsOrPendingError extends Error {
  constructor() {
    super("Ya tienen una amistad o solicitud pendiente");
    this.name = "AlreadyFriendsOrPendingError";
  }
}

export class NoFriendRequestError extends Error {
  constructor() {
    super("No hay solicitud pendiente");
    this.name = "NoFriendRequestError";
  }
}

export const friendshipService = {
  async sendRequest(senderId: string, targetId: string): Promise<void> {
    if (senderId === targetId) throw new CannotFriendSelfError();

    const existing = await friendshipRepository.get(senderId, targetId);
    if (existing) throw new AlreadyFriendsOrPendingError();

    await friendshipRepository.upsertPair({
      userA: senderId,
      userB: targetId,
      status: "PENDING",
      requestedBy: senderId,
    });

    // Notificar al receptor
    try {
      const sender = await userRepository.getById(senderId);
      if (sender) {
        const notif = buildNotification({
          userId: targetId,
          type: "FRIEND_REQUEST",
          title: "Nueva solicitud de amistad",
          body: `${sender.displayName}#${sender.tag} quiere ser tu amigo`,
          metadata: { senderId, link: "/amigos" },
        });
        notif.notifId = newId();
        await notificationRepository.create(notif);
      }
    } catch (err) {
      console.warn("[friendship] no se pudo notificar request:", err);
    }
  },

  async acceptRequest(receiverId: string, senderId: string): Promise<void> {
    const f = await friendshipRepository.get(receiverId, senderId);
    if (!f || f.status !== "PENDING" || f.requestedBy === receiverId) {
      throw new NoFriendRequestError();
    }
    await friendshipRepository.setStatusPair(receiverId, senderId, "ACCEPTED");

    // Notificar al solicitante original que fue aceptado
    try {
      const receiver = await userRepository.getById(receiverId);
      if (receiver) {
        const notif = buildNotification({
          userId: senderId,
          type: "FRIEND_REQUEST",
          title: "¡Solicitud aceptada! 🎉",
          body: `${receiver.displayName}#${receiver.tag} ahora es tu amigo`,
          metadata: { friendId: receiverId, link: "/amigos" },
        });
        notif.notifId = newId();
        await notificationRepository.create(notif);
      }
    } catch (err) {
      console.warn("[friendship] no se pudo notificar accept:", err);
    }
  },

  /** Rechaza la recibida o cancela la propia. Mismo efecto: borrar par. */
  async rejectOrCancel(userId: string, otherId: string): Promise<void> {
    const f = await friendshipRepository.get(userId, otherId);
    if (!f || f.status !== "PENDING") return; // idempotente
    await friendshipRepository.deletePair(userId, otherId);
  },

  /** Elimina amistad ya aceptada. Cualquiera de los dos puede. */
  async removeFriendship(userId: string, otherId: string): Promise<void> {
    const f = await friendshipRepository.get(userId, otherId);
    if (!f || f.status !== "ACCEPTED") return; // idempotente
    await friendshipRepository.deletePair(userId, otherId);
  },

  async listFriends(userId: string): Promise<string[]> {
    const all = await friendshipRepository.listByUser(userId);
    return all.filter((f) => f.status === "ACCEPTED").map((f) => f.friendId);
  },

  async listPendingReceived(userId: string): Promise<string[]> {
    const all = await friendshipRepository.listByUser(userId);
    return all
      .filter((f) => f.status === "PENDING" && f.requestedBy !== userId)
      .map((f) => f.friendId);
  },

  async listPendingSent(userId: string): Promise<string[]> {
    const all = await friendshipRepository.listByUser(userId);
    return all
      .filter((f) => f.status === "PENDING" && f.requestedBy === userId)
      .map((f) => f.friendId);
  },
};
