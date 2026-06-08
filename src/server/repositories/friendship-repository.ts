/**
 * FriendshipRepository — tabla Friendships.
 *
 * Estrategia bidireccional: cada amistad/solicitud se guarda como DOS items.
 * Si A le envía a B, insertamos:
 *   (userId=A, friendId=B, status=PENDING, requestedBy=A)
 *   (userId=B, friendId=A, status=PENDING, requestedBy=A)
 *
 * Esto permite que CADA usuario consulte sus relaciones queryando por su
 * propio userId (PK). Sin GSI extra, sin scans.
 *
 * El `requestedBy` distingue:
 *  - Para A: requestedBy === userId → PENDING_SENT (yo lo mandé)
 *  - Para B: requestedBy !== userId → PENDING_RECEIVED (me llegó)
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
import type { Friendship, FriendshipRelation } from "@/types";

export const friendshipRepository = {
  async get(userId: string, friendId: string): Promise<Friendship | null> {
    const res = await ddb.send(
      new GetCommand({
        TableName: TABLES.FRIENDSHIPS,
        Key: { userId, friendId },
      }),
    );
    return (res.Item as Friendship | undefined) ?? null;
  },

  /** Inserta los dos items de la relación (a→b y b→a). */
  async upsertPair(params: {
    userA: string;
    userB: string;
    status: Friendship["status"];
    requestedBy: string;
  }): Promise<void> {
    const ts = now();
    await Promise.all([
      ddb.send(
        new PutCommand({
          TableName: TABLES.FRIENDSHIPS,
          Item: {
            userId: params.userA,
            friendId: params.userB,
            status: params.status,
            requestedBy: params.requestedBy,
            createdAt: ts,
          },
        }),
      ),
      ddb.send(
        new PutCommand({
          TableName: TABLES.FRIENDSHIPS,
          Item: {
            userId: params.userB,
            friendId: params.userA,
            status: params.status,
            requestedBy: params.requestedBy,
            createdAt: ts,
          },
        }),
      ),
    ]);
  },

  async setStatusPair(
    userA: string,
    userB: string,
    status: Friendship["status"],
  ): Promise<void> {
    await Promise.all([
      ddb.send(
        new UpdateCommand({
          TableName: TABLES.FRIENDSHIPS,
          Key: { userId: userA, friendId: userB },
          UpdateExpression: "SET #s = :s",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: { ":s": status },
        }),
      ),
      ddb.send(
        new UpdateCommand({
          TableName: TABLES.FRIENDSHIPS,
          Key: { userId: userB, friendId: userA },
          UpdateExpression: "SET #s = :s",
          ExpressionAttributeNames: { "#s": "status" },
          ExpressionAttributeValues: { ":s": status },
        }),
      ),
    ]);
  },

  async deletePair(userA: string, userB: string): Promise<void> {
    await Promise.all([
      ddb.send(
        new DeleteCommand({
          TableName: TABLES.FRIENDSHIPS,
          Key: { userId: userA, friendId: userB },
        }),
      ),
      ddb.send(
        new DeleteCommand({
          TableName: TABLES.FRIENDSHIPS,
          Key: { userId: userB, friendId: userA },
        }),
      ),
    ]);
  },

  /** Lista todas las relaciones de un usuario (cualquier status). */
  async listByUser(userId: string): Promise<Friendship[]> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.FRIENDSHIPS,
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
      }),
    );
    return (res.Items as Friendship[]) ?? [];
  },
};

/**
 * Calcula la relación entre dos usuarios desde la perspectiva de myUserId.
 * Útil para decidir qué botones mostrar en /perfil de alguien.
 */
export async function getRelation(
  myUserId: string,
  otherUserId: string,
): Promise<FriendshipRelation> {
  if (myUserId === otherUserId) return "SELF";
  const f = await friendshipRepository.get(myUserId, otherUserId);
  if (!f) return "NONE";
  if (f.status === "ACCEPTED") return "ACCEPTED";
  if (f.status === "PENDING") {
    return f.requestedBy === myUserId ? "PENDING_SENT" : "PENDING_RECEIVED";
  }
  return "NONE";
}
