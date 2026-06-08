/**
 * SpecialEventRepository — tabla SpecialEvents.
 *
 * Guarda en: src/server/repositories/special-event-repository.ts
 */

import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/aws/client";
import { TABLES } from "@/lib/aws/tables";
import { now } from "@/lib/utils";
import type { SpecialEvent, SpecialEventStatus } from "@/types";

export const specialEventRepository = {
  async getById(eventId: string): Promise<SpecialEvent | null> {
    const res = await ddb.send(
      new GetCommand({ TableName: TABLES.SPECIAL_EVENTS, Key: { eventId } }),
    );
    return (res.Item as SpecialEvent | undefined) ?? null;
  },

  async create(event: SpecialEvent): Promise<void> {
    await ddb.send(
      new PutCommand({ TableName: TABLES.SPECIAL_EVENTS, Item: event }),
    );
  },

  async listByStatus(status: SpecialEventStatus): Promise<SpecialEvent[]> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.SPECIAL_EVENTS,
        IndexName: "byStatus",
        KeyConditionExpression: "#s = :status",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":status": status },
      }),
    );
    return (res.Items as SpecialEvent[]) ?? [];
  },

  /** Resuelve el evento: guarda la respuesta correcta y lo marca RESOLVED. */
  async resolve(eventId: string, correctAnswer: string): Promise<void> {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.SPECIAL_EVENTS,
        Key: { eventId },
        UpdateExpression:
          "SET #s = :resolved, correctAnswer = :ans, resolvedAt = :t, updatedAt = :t",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":resolved": "RESOLVED" as SpecialEventStatus,
          ":ans": correctAnswer,
          ":t": now(),
        },
      }),
    );
  },

  /** Cambia el status del evento (DRAFT → ACTIVE → CLOSED). */
  async updateStatus(
    eventId: string,
    status: SpecialEventStatus,
  ): Promise<void> {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.SPECIAL_EVENTS,
        Key: { eventId },
        UpdateExpression: "SET #s = :status, updatedAt = :t",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":status": status, ":t": now() },
      }),
    );
  },
};