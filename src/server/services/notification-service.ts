/**
 * Notification service — helpers de alto nivel para emitir notifs tipadas.
 *
 * Centralizamos el copy y los metadatos así un cambio de redacción
 * vive en un solo lugar. Cada función:
 *   1. Genera un ULID para notifId
 *   2. Arma el body con el contexto
 *   3. Persiste vía repository
 *
 * Los triggers de notif viven en los services de negocio (group, scoring, etc).
 */

import {
  notificationRepository,
  buildNotification,
} from "@/server/repositories";
import { newId } from "@/lib/utils";

export const notificationService = {
  /** "Has sido aceptado al grupo X". */
  async groupRequestApproved(params: {
    userId: string;
    groupId: string;
    groupName: string;
  }): Promise<void> {
    const n = buildNotification({
      userId: params.userId,
      type: "ADDED_TO_GROUP",
      title: "Solicitud aceptada 🎉",
      body: `Ya eres miembro de ${params.groupName}. ¡A predecir!`,
      metadata: { groupId: params.groupId, link: `/mis-grupos/${params.groupId}` },
    });
    n.notifId = newId();
    await notificationRepository.create(n);
  },

  /** "Tu solicitud fue rechazada". */
  async groupRequestRejected(params: {
    userId: string;
    groupName: string;
  }): Promise<void> {
    const n = buildNotification({
      userId: params.userId,
      type: "ADMIN_MESSAGE",
      title: "Solicitud rechazada",
      body: `El owner de ${params.groupName} rechazó tu solicitud.`,
    });
    n.notifId = newId();
    await notificationRepository.create(n);
  },

  /** "Alguien quiere unirse a tu grupo" — para el owner. */
  async newGroupRequest(params: {
    ownerId: string;
    groupId: string;
    groupName: string;
    requesterName: string;
    requesterTag: string;
  }): Promise<void> {
    const n = buildNotification({
      userId: params.ownerId,
      type: "ADDED_TO_GROUP",
      title: "Nueva solicitud para tu grupo",
      body: `${params.requesterName}#${params.requesterTag} quiere unirse a ${params.groupName}`,
      metadata: { groupId: params.groupId, link: `/mis-grupos/${params.groupId}` },
    });
    n.notifId = newId();
    await notificationRepository.create(n);
  },

  /** "Ganaste N puntos en el partido X". */
  async matchScored(params: {
    userId: string;
    matchId: string;
    homeTeam: string;
    awayTeam: string;
    points: number;
  }): Promise<void> {
    const n = buildNotification({
      userId: params.userId,
      type: "MATCH_RESULT",
      title: params.points > 0 ? `+${params.points} pts ganados!` : "Partido terminado",
      body: `${params.homeTeam} vs ${params.awayTeam}`,
      metadata: { matchId: params.matchId, link: "/mis-apuestas" },
    });
    n.notifId = newId();
    await notificationRepository.create(n);
  },

  /**
   * "Nuevo mensaje en el chat" — para el receptor.
   * Incluye groupId y groupName para que NotificationBell
   * agrupe múltiples mensajes del mismo chat en una sola notif.
   */
  async newChatMessage(params: {
    userId: string;
    groupId: string;
    groupName: string;
    senderName: string;
  }): Promise<void> {
    const n = buildNotification({
      userId: params.userId,
      type: "ADMIN_MESSAGE",
      title: `Nuevo mensaje en ${params.groupName}`,
      body: `${params.senderName} envió un mensaje.`,
      metadata: {
        groupId: params.groupId,
        groupName: params.groupName,
        link: `/chats/${params.groupId}`,
      },
    });
    n.notifId = newId();
    await notificationRepository.create(n);
  },
};