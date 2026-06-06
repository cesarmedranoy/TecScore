/**
 * GroupRequestRepository — tabla GroupRequests.
 *
 * Solicitudes para unirse a grupos PRIVADOS. Tienen TTL de 12 horas;
 * si no son aprobadas a tiempo, se descartan en read-time (filtrado).
 *
 * Más adelante (Fase 7) activamos el TTL nativo de DynamoDB para
 * que las borre automáticamente del storage, pero para MVP basta con
 * filtrar en read.
 */

import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/aws/client";
import { TABLES } from "@/lib/aws/tables";
import { now } from "@/lib/utils";
import type { GroupRequest } from "@/types";

export const REQUEST_TTL_HOURS = 12;

export function isRequestExpired(
  req: Pick<GroupRequest, "expiresAt">,
  atTime: Date = new Date(),
): boolean {
  return new Date(req.expiresAt).getTime() <= atTime.getTime();
}

export const groupRequestRepository = {
  async get(groupId: string, userId: string): Promise<GroupRequest | null> {
    const res = await ddb.send(
      new GetCommand({
        TableName: TABLES.GROUP_REQUESTS,
        Key: { groupId, userId },
      }),
    );
    return (res.Item as GroupRequest | undefined) ?? null;
  },

  async create(req: GroupRequest): Promise<void> {
    await ddb.send(
      new PutCommand({
        TableName: TABLES.GROUP_REQUESTS,
        Item: req,
      }),
    );
  },

  async delete(groupId: string, userId: string): Promise<void> {
    await ddb.send(
      new DeleteCommand({
        TableName: TABLES.GROUP_REQUESTS,
        Key: { groupId, userId },
      }),
    );
  },

  async setStatus(
    groupId: string,
    userId: string,
    status: GroupRequest["status"],
  ): Promise<void> {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.GROUP_REQUESTS,
        Key: { groupId, userId },
        UpdateExpression: "SET #s = :status, decidedAt = :t",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":status": status, ":t": now() },
      }),
    );
  },

  /**
   * Lista solicitudes pendientes (no expiradas). El filtrado de expiración
   * lo hacemos en memoria porque las solicitudes son pocas por grupo.
   */
  async listPendingByGroup(groupId: string): Promise<GroupRequest[]> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.GROUP_REQUESTS,
        KeyConditionExpression: "groupId = :g",
        FilterExpression: "#s = :pending",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":g": groupId,
          ":pending": "PENDING",
        },
      }),
    );
    const items = (res.Items as GroupRequest[]) ?? [];
    const nowDate = new Date();
    return items.filter((r) => !isRequestExpired(r, nowDate));
  },
};
