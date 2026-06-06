/**
 * PointsRepository — única capa que toca la tabla Points.
 *
 * Cada item de esta tabla es un "evento" inmutable: "el usuario X ganó N
 * puntos por el partido Y por las razones Z". Nunca se actualiza, solo
 * se inserta (event sourcing simplificado).
 *
 * Esto nos da:
 *  - Historial auditable: "¿por qué ganó esos puntos?"
 *  - Idempotencia natural: una clave (userId, matchId) → un solo Put
 *  - Capacidad de recalcular: si descubrimos un bug en el scoring,
 *    podemos truncar y reprocesar desde Predictions.
 */

import {
  ConditionalCheckFailedException,
} from "@aws-sdk/client-dynamodb";
import {
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/aws/client";
import { TABLES } from "@/lib/aws/tables";
import type { PointEntry } from "@/types";

export class PointsAlreadyAwardedError extends Error {
  constructor(userId: string, matchId: string) {
    super(
      `Ya hay puntos asignados a user=${userId} para match=${matchId}`,
    );
    this.name = "PointsAlreadyAwardedError";
  }
}

export const pointsRepository = {
  /**
   * Asigna puntos a un usuario por un partido.
   *
   * Idempotente vía ConditionExpression: si ya existe el item (mismo
   * userId+matchId), lanza error en vez de sobreescribir. Esto es la
   * segunda capa de defensa contra duplicación de puntos (la primera
   * está en matchRepository.markAsScored).
   */
  async award(entry: PointEntry): Promise<void> {
    try {
      await ddb.send(
        new PutCommand({
          TableName: TABLES.POINTS,
          Item: entry,
          ConditionExpression:
            "attribute_not_exists(userId) AND attribute_not_exists(matchId)",
        }),
      );
    } catch (err) {
      if (err instanceof ConditionalCheckFailedException) {
        throw new PointsAlreadyAwardedError(entry.userId, entry.matchId);
      }
      throw err;
    }
  },

  async listByUser(userId: string): Promise<PointEntry[]> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.POINTS,
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
      }),
    );
    return (res.Items as PointEntry[]) ?? [];
  },
};
