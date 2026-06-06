/**
 * GroupMemberRepository — tabla GroupMembers (junction).
 *
 * Es la "verdad" sobre quién está en qué grupo. Group.memberCount es
 * un denormalizado para mostrar en UI sin contar.
 */

import {
  ConditionalCheckFailedException,
} from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/aws/client";
import { TABLES } from "@/lib/aws/tables";
import type { GroupMember } from "@/types";

export class AlreadyMemberError extends Error {
  constructor(groupId: string, userId: string) {
    super(`Usuario ${userId} ya es miembro del grupo ${groupId}`);
    this.name = "AlreadyMemberError";
  }
}

export const groupMemberRepository = {
  async get(groupId: string, userId: string): Promise<GroupMember | null> {
    const res = await ddb.send(
      new GetCommand({
        TableName: TABLES.GROUP_MEMBERS,
        Key: { groupId, userId },
      }),
    );
    return (res.Item as GroupMember | undefined) ?? null;
  },

  async isMember(groupId: string, userId: string): Promise<boolean> {
    const item = await this.get(groupId, userId);
    return item !== null;
  },

  /**
   * Agrega un miembro. ConditionExpression evita doble-insert si dos
   * requests entran concurrentes (defense in depth contra carrera).
   */
  async add(member: GroupMember): Promise<void> {
    try {
      await ddb.send(
        new PutCommand({
          TableName: TABLES.GROUP_MEMBERS,
          Item: member,
          ConditionExpression: "attribute_not_exists(groupId)",
        }),
      );
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) {
        throw new AlreadyMemberError(member.groupId, member.userId);
      }
      throw err;
    }
  },

  async remove(groupId: string, userId: string): Promise<void> {
    await ddb.send(
      new DeleteCommand({
        TableName: TABLES.GROUP_MEMBERS,
        Key: { groupId, userId },
      }),
    );
  },

  /** Lista todos los miembros de un grupo (para ranking). */
  async listByGroup(groupId: string): Promise<GroupMember[]> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.GROUP_MEMBERS,
        KeyConditionExpression: "groupId = :g",
        ExpressionAttributeValues: { ":g": groupId },
      }),
    );
    return (res.Items as GroupMember[]) ?? [];
  },

  /** Lista todos los grupos de un usuario (vía GSI byUser). */
  async listByUser(userId: string): Promise<GroupMember[]> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.GROUP_MEMBERS,
        IndexName: "byUser",
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
      }),
    );
    return (res.Items as GroupMember[]) ?? [];
  },

  /** Cuenta cuántos grupos tiene un usuario. Para chequear el límite de 5. */
  async countByUser(userId: string): Promise<number> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.GROUP_MEMBERS,
        IndexName: "byUser",
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
        Select: "COUNT",
      }),
    );
    return res.Count ?? 0;
  },
};
