/**
 * GroupRepository — tabla Groups.
 */

import {
  ConditionalCheckFailedException,
} from "@aws-sdk/client-dynamodb";
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
import { normalizeJoinCode } from "@/lib/groups/join-code";
import type { Group } from "@/types";

export class JoinCodeAlreadyExistsError extends Error {
  constructor(code: string) {
    super(`El código ${code} ya está en uso`);
    this.name = "JoinCodeAlreadyExistsError";
  }
}

export const groupRepository = {
  async getById(groupId: string): Promise<Group | null> {
    const res = await ddb.send(
      new GetCommand({ TableName: TABLES.GROUPS, Key: { groupId } }),
    );
    return (res.Item as Group | undefined) ?? null;
  },

  async getByJoinCode(rawCode: string): Promise<Group | null> {
    const code = normalizeJoinCode(rawCode);
    const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.GROUPS,
        IndexName: "byCode",
        KeyConditionExpression: "joinCode = :c",
        ExpressionAttributeValues: { ":c": formatted },
        Limit: 1,
      }),
    );
    return (res.Items?.[0] as Group | undefined) ?? null;
  },

  /**
   * Crea un grupo con condición sobre groupId (que es ULID, así que único).
   * El caller debe garantizar la unicidad del joinCode (chequear + retry).
   */
  async create(group: Group): Promise<void> {
    await ddb.send(
      new PutCommand({
        TableName: TABLES.GROUPS,
        Item: group,
        ConditionExpression: "attribute_not_exists(groupId)",
      }),
    );
  },

  async delete(groupId: string): Promise<void> {
    await ddb.send(
      new DeleteCommand({ TableName: TABLES.GROUPS, Key: { groupId } }),
    );
  },

  async listByOwner(ownerId: string): Promise<Group[]> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.GROUPS,
        IndexName: "byOwner",
        KeyConditionExpression: "ownerId = :o",
        ExpressionAttributeValues: { ":o": ownerId },
      }),
    );
    return (res.Items as Group[]) ?? [];
  },

  /**
   * Incremento atómico de memberCount. ADD garantiza que dos joins
   * concurrentes no se pisen.
   */
  async adjustMemberCount(groupId: string, delta: number): Promise<void> {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.GROUPS,
        Key: { groupId },
        UpdateExpression: "ADD memberCount :d",
        ExpressionAttributeValues: { ":d": delta },
      }),
    );
  },

  async setVisibility(
    groupId: string,
    visibility: "PUBLIC" | "PRIVATE",
  ): Promise<void> {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.GROUPS,
        Key: { groupId },
        UpdateExpression: "SET visibility = :v",
        ExpressionAttributeValues: { ":v": visibility },
      }),
    );
  },
};

export { ConditionalCheckFailedException };
