/**
 * Chequea si un email está en AdminAllowlist (DynamoDB).
 *
 * Patrón "Allowlist": solo correos sembrados manualmente en la tabla
 * obtienen rol ADMIN al loguearse. Esto evita el agujero de seguridad
 * de tener un botón "elegir rol" en la UI.
 *
 * Optimización (Fase 7): cachear el resultado en Redis con TTL de 5 min
 * para evitar pegarle a DynamoDB en cada login.
 */

import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/aws/client";
import { TABLES } from "@/lib/aws/tables";

export async function isAdminEmail(email: string): Promise<boolean> {
  if (!email) return false;
  const res = await ddb.send(
    new GetCommand({
      TableName: TABLES.ADMIN_ALLOWLIST,
      Key: { email: email.toLowerCase() },
    }),
  );
  return !!res.Item;
}
