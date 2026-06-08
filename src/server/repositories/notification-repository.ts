/**
 * NotificationRepository — tabla Notifications.
 *
 * Cada notif es: userId (destinatario), notifId (ULID = orden cronológico),
 * type, title, body, read, createdAt.
 *
 * Patrón: las notifs son INMUTABLES después de crearse. Solo cambia el flag
 * `read`. Esto facilita las consultas y evita races.
 */

import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/aws/client";
import { TABLES } from "@/lib/aws/tables";
import { now } from "@/lib/utils";
import type { Notification } from "@/types";

export const notificationRepository = {
  async create(notif: Notification): Promise<void> {
    await ddb.send(
      new PutCommand({
        TableName: TABLES.NOTIFICATIONS,
        Item: notif,
      }),
    );
  },

  /**
   * Lista las notifs más recientes de un usuario.
   * Como notifId es ULID, ordenamos descendente (ScanIndexForward=false).
   */
  async listByUser(
    userId: string,
    limit = 30,
  ): Promise<Notification[]> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.NOTIFICATIONS,
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
        ScanIndexForward: false, // más recientes primero
        Limit: limit,
      }),
    );
    return (res.Items as Notification[]) ?? [];
  },

  async countUnread(userId: string): Promise<number> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.NOTIFICATIONS,
        KeyConditionExpression: "userId = :u",
        FilterExpression: "#r = :false",
        ExpressionAttributeNames: { "#r": "read" },
        ExpressionAttributeValues: { ":u": userId, ":false": false },
        Select: "COUNT",
      }),
    );
    return res.Count ?? 0;
  },

  async markAsRead(userId: string, notifId: string): Promise<void> {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.NOTIFICATIONS,
        Key: { userId, notifId },
        UpdateExpression: "SET #r = :true",
        ExpressionAttributeNames: { "#r": "read" },
        ExpressionAttributeValues: { ":true": true },
      }),
    );
  },

  async markAllAsRead(userId: string): Promise<void> {
    const notifs = await this.listByUser(userId, 100);
    const unread = notifs.filter((n) => !n.read);
    for (const n of unread) {
      await this.markAsRead(userId, n.notifId);
    }
  },
};

/** Helper para crear una notificación con defaults sensatos. */
export function buildNotification(params: {
  userId: string;
  type: Notification["type"];
  title: string;
  body: string;
  metadata?: Record<string, string>;
}): Notification {
  return {
    userId: params.userId,
    notifId: "", // lo asigna el caller con newId() para que sea inyectable en tests
    type: params.type,
    title: params.title,
    body: params.body,
    metadata: params.metadata,
    read: false,
    createdAt: now(),
  };
}
