/**
 * Upsert de usuario desde el perfil de Google.
 *
 * Por qué upsert y no insert puro:
 *  - Si el usuario YA existe: actualizamos role (por si lo agregamos al
 *    allowlist), nombre y avatar (por si los cambió en Google).
 *  - Si NO existe: lo creamos con tag aleatorio, 0 puntos, racha 0.
 *
 * El "tag" es estilo Discord: 4 chars únicos para distinguir usuarios
 * con el mismo nombre (ej. "Julio#a4f9"). Lo derivamos del ULID porque
 * la entropía del ULID nos garantiza unicidad práctica sin colisiones.
 */

import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/aws/client";
import { TABLES } from "@/lib/aws/tables";
import { newId, now } from "@/lib/utils";
import type { Role, User } from "@/types";

interface GoogleProfile {
  email: string;
  googleId: string;
  displayName: string;
  avatarUrl: string;
  role: Role;
}

/** Genera el tag estilo "a4f9" tomando los últimos 4 chars del ULID. */
function deriveTag(userId: string): string {
  return userId.slice(-4).toLowerCase();
}

export async function upsertUserFromGoogle(p: GoogleProfile): Promise<User> {
  const email = p.email.toLowerCase();

  // 1. Buscar por email vía GSI
  const existing = await ddb.send(
    new QueryCommand({
      TableName: TABLES.USERS,
      IndexName: "byEmail",
      KeyConditionExpression: "email = :e",
      ExpressionAttributeValues: { ":e": email },
      Limit: 1,
    }),
  );

  const ts = now();

  // 2a. Existe → actualizar SOLO role + avatarUrl (Google).
  //     El displayName NO se toca porque el usuario lo pudo haber editado
  //     en /perfil. Comportamiento estilo Steam: el nombre custom persiste
  //     hasta que vuelvas a cambiarlo.
  if (existing.Items && existing.Items.length > 0) {
    const u = existing.Items[0] as User;
    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.USERS,
        Key: { userId: u.userId },
        UpdateExpression:
          "SET #role = :role, avatarUrl = :avatar, updatedAt = :ts",
        ExpressionAttributeNames: { "#role": "role" },
        ExpressionAttributeValues: {
          ":role": p.role,
          ":avatar": p.avatarUrl,
          ":ts": ts,
        },
      }),
    );
    return {
      ...u,
      role: p.role,
      avatarUrl: p.avatarUrl,
      updatedAt: ts,
    };
  }

  // 2b. No existe → crear nuevo
  const userId = newId();
  const user: User = {
    userId,
    email,
    googleId: p.googleId,
    displayName: p.displayName || "Jugador",
    tag: deriveTag(userId),
    avatarUrl: p.avatarUrl,
    role: p.role,
    totalPoints: 0,
    currentStreak: 0,
    maxStreak: 0,
    createdAt: ts,
    updatedAt: ts,
  };
  await ddb.send(new PutCommand({ TableName: TABLES.USERS, Item: user }));
  return user;
}
