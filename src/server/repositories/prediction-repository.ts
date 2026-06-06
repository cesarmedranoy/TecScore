/**
 * PredictionRepository — única capa que toca la tabla Predictions.
 *
 * Las predicciones NUNCA se borran: si un usuario cambia su predicción,
 * sobreescribimos (Put). Si abandona un grupo, la predicción persiste
 * (decisión de arquitectura: predicción es del usuario, no del grupo).
 */

import {
  GetCommand,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/aws/client";
import { TABLES } from "@/lib/aws/tables";
import type { Prediction } from "@/types";

export const predictionRepository = {
  async getByUserAndMatch(
    userId: string,
    matchId: string,
  ): Promise<Prediction | null> {
    const res = await ddb.send(
      new GetCommand({
        TableName: TABLES.PREDICTIONS,
        Key: { userId, matchId },
      }),
    );
    return (res.Item as Prediction | undefined) ?? null;
  },

  /**
   * Upsert: si ya existe, la sobreescribe.
   *
   * La validación "no se puede cambiar predicción a <10 min del partido"
   * vive en el service, NO acá. El repo solo persiste.
   */
  async upsert(prediction: Prediction): Promise<void> {
    await ddb.send(
      new PutCommand({
        TableName: TABLES.PREDICTIONS,
        Item: prediction,
      }),
    );
  },

  /**
   * Lista todas las predicciones de un partido (vía GSI byMatch).
   * Esta es la query principal del scoring engine.
   */
  async listByMatch(matchId: string): Promise<Prediction[]> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.PREDICTIONS,
        IndexName: "byMatch",
        KeyConditionExpression: "matchId = :m",
        ExpressionAttributeValues: { ":m": matchId },
      }),
    );
    return (res.Items as Prediction[]) ?? [];
  },

  /**
   * Lista todas las predicciones de un usuario.
   * Útil para la vista "Mis apuestas" y para calcular rachas.
   */
  async listByUser(userId: string): Promise<Prediction[]> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.PREDICTIONS,
        KeyConditionExpression: "userId = :u",
        ExpressionAttributeValues: { ":u": userId },
      }),
    );
    return (res.Items as Prediction[]) ?? [];
  },
};
