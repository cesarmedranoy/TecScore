/**
 * UserRepository — única capa que toca la tabla Users.
 *
 * Convención senior: los repositorios son "tontos" (CRUD puro).
 * La lógica de negocio vive en services, no acá.
 *
 * Por qué objeto y no clase: no necesitamos estado ni herencia,
 * solo un namespace de funciones. Menos boilerplate, mismos beneficios.
 */

import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/aws/client";
import { TABLES } from "@/lib/aws/tables";
import { now } from "@/lib/utils";
import type { User } from "@/types";

export const userRepository = {
  async getById(userId: string): Promise<User | null> {
    const res = await ddb.send(
      new GetCommand({ TableName: TABLES.USERS, Key: { userId } }),
    );
    return (res.Item as User | undefined) ?? null;
  },

  /**
   * Suma puntos atómicamente. Usar ADD (no SET) garantiza que dos updates
   * concurrentes no se pisen — DynamoDB serializa el incremento.
   */
  async addPoints(userId: string, delta: number): Promise<void> {
    if (delta === 0) return;
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { userId },
        UpdateExpression: "ADD totalPoints :p SET updatedAt = :t",
        ExpressionAttributeValues: { ":p": delta, ":t": now() },
      }),
    );
  },

  /**
   * Actualiza racha. Lo separamos de addPoints porque la racha NO siempre
   * crece con los puntos (un acierto de "diferencia de goles" suma puntos
   * pero no necesariamente extiende la racha — depende de cómo cuente
   * el motor de scoring).
   */
  async setStreak(
    userId: string,
    currentStreak: number,
    maxStreak: number,
  ): Promise<void> {
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { userId },
        UpdateExpression:
          "SET currentStreak = :c, maxStreak = :m, updatedAt = :t",
        ExpressionAttributeValues: {
          ":c": currentStreak,
          ":m": maxStreak,
          ":t": now(),
        },
      }),
    );
  },

  /** Actualiza preset de avatar + (opcionalmente) displayName. */
  async updateProfile(
    userId: string,
    fields: { displayName?: string; avatarPreset?: string },
  ): Promise<void> {
    const sets: string[] = ["updatedAt = :t"];
    const values: Record<string, unknown> = { ":t": now() };
    if (fields.displayName !== undefined) {
      sets.push("displayName = :n");
      values[":n"] = fields.displayName;
    }
    if (fields.avatarPreset !== undefined) {
      sets.push("avatarPreset = :a");
      values[":a"] = fields.avatarPreset;
    }
    if (sets.length === 1) return; // nada que actualizar
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { userId },
        UpdateExpression: `SET ${sets.join(", ")}`,
        ExpressionAttributeValues: values,
      }),
    );
  },
};
