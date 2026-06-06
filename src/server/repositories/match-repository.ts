/**
 * MatchRepository — única capa que toca la tabla Matches.
 *
 * Las transiciones de estado (FSM) NO viven acá — viven en
 * src/lib/scoring/match-state.ts. Acá solo persistimos.
 */

import {
  ConditionalCheckFailedException,
} from "@aws-sdk/client-dynamodb";
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/aws/client";
import { TABLES } from "@/lib/aws/tables";
import { now } from "@/lib/utils";
import type { Match, MatchStatus } from "@/types";

/**
 * Error específico cuando un partido ya fue scoreado y se intenta
 * scorearlo de nuevo. El service captura esto para evitar duplicar puntos.
 */
export class MatchAlreadyScoredError extends Error {
  constructor(matchId: string) {
    super(`Match ${matchId} ya fue scoreado previamente`);
    this.name = "MatchAlreadyScoredError";
  }
}

export const matchRepository = {
  async getById(matchId: string): Promise<Match | null> {
    const res = await ddb.send(
      new GetCommand({ TableName: TABLES.MATCHES, Key: { matchId } }),
    );
    return (res.Item as Match | undefined) ?? null;
  },

  async create(match: Match): Promise<void> {
    await ddb.send(new PutCommand({ TableName: TABLES.MATCHES, Item: match }));
  },

  /**
   * Persiste el resultado y mueve el estado a FINISHED.
   * scored=false para que el scoring engine sepa que debe procesarlo.
   */
  async setResult(
    matchId: string,
    homeScore: number,
    awayScore: number,
  ): Promise<void> {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.MATCHES,
        Key: { matchId },
        UpdateExpression:
          "SET #s = :status, homeScore = :h, awayScore = :a, scored = :scored, updatedAt = :t",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: {
          ":status": "FINISHED" as MatchStatus,
          ":h": homeScore,
          ":a": awayScore,
          ":scored": false,
          ":t": now(),
        },
      }),
    );
  },

  /**
   * Marca el partido como scoreado de forma idempotente.
   *
   * Si ya estaba scored=true, lanza MatchAlreadyScoredError. Esto evita
   * que dos workers concurrentes calculen puntos dos veces para el mismo
   * partido. Es la piedra angular de la idempotencia del scoring.
   */
  async markAsScored(matchId: string): Promise<void> {
    try {
      await ddb.send(
        new UpdateCommand({
          TableName: TABLES.MATCHES,
          Key: { matchId },
          UpdateExpression: "SET scored = :true, scoredAt = :t",
          ConditionExpression:
            "scored = :false OR attribute_not_exists(scored)",
          ExpressionAttributeValues: {
            ":true": true,
            ":false": false,
            ":t": now(),
          },
        }),
      );
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) {
        throw new MatchAlreadyScoredError(matchId);
      }
      throw err;
    }
  },

  async updateStatus(matchId: string, status: MatchStatus): Promise<void> {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.MATCHES,
        Key: { matchId },
        UpdateExpression: "SET #s = :status, updatedAt = :t",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":status": status, ":t": now() },
      }),
    );
  },

  async listByStatus(status: MatchStatus): Promise<Match[]> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.MATCHES,
        IndexName: "byStatus",
        KeyConditionExpression: "#s = :status",
        ExpressionAttributeNames: { "#s": "status" },
        ExpressionAttributeValues: { ":status": status },
      }),
    );
    return (res.Items as Match[]) ?? [];
  },

  /**
   * Lista todos los partidos. Usa Scan — aceptable para <100 items
   * (el Mundial tiene 64). Para crecer más allá, mover a paginated GSI.
   */
  async listAll(): Promise<Match[]> {
    const res = await ddb.send(
      new ScanCommand({ TableName: TABLES.MATCHES }),
    );
    return (res.Items as Match[]) ?? [];
  },
};
