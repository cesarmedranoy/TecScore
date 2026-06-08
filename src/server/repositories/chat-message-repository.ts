/**
 * ChatMessageRepository — tabla ChatMessages.
 *
 * El "groupId" PK de la tabla se reusa semánticamente como `channelId`:
 *  - DM entre A y B  → channelId = `dm_${sorted([A,B]).join("_")}`
 *  - Chat de grupo X → channelId = `g_${X}` (futuro)
 *
 * Esto permite usar la misma tabla para 1-a-1 y grupos.
 */

import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/aws/client";
import { TABLES } from "@/lib/aws/tables";
import type { ChatMessage } from "@/types";

export const chatMessageRepository = {
  async send(message: ChatMessage): Promise<void> {
    await ddb.send(
      new PutCommand({
        TableName: TABLES.CHAT_MESSAGES,
        Item: { ...message, groupId: message.groupId },
      }),
    );
  },

  /**
   * Lista los mensajes de un canal en orden cronológico ascendente.
   * Los más recientes al final (para scroll-to-bottom).
   */
  async listByChannel(
    channelId: string,
    limit = 100,
  ): Promise<ChatMessage[]> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.CHAT_MESSAGES,
        KeyConditionExpression: "groupId = :c",
        ExpressionAttributeValues: { ":c": channelId },
        ScanIndexForward: false, // descendente (recientes primero)
        Limit: limit,
      }),
    );
    const items = (res.Items as ChatMessage[]) ?? [];
    // Devolvemos en orden cronológico ascendente para la UI
    return items.reverse();
  },
};

/**
 * Construye el channelId determinístico para un DM entre dos usuarios.
 * La ordenación garantiza que (A, B) y (B, A) den el mismo canal.
 */
export function makeDmChannelId(userIdA: string, userIdB: string): string {
  const [a, b] = [userIdA, userIdB].sort();
  return `dm_${a}_${b}`;
}
