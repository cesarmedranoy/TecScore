/**
 * Destruye TODAS las tablas de TecScore.
 *
 * ⚠️  SOLO PARA DESARROLLO LOCAL.
 *
 * Por seguridad, este script falla si NO está apuntando a DynamoDB Local.
 * Si alguna vez necesitas resetear en AWS, hazlo manualmente desde la consola.
 *
 * Uso:
 *   npm run db:reset
 */

import {
  DynamoDBClient,
  DeleteTableCommand,
  ListTablesCommand,
} from "@aws-sdk/client-dynamodb";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

const isLocal = !!process.env.DYNAMODB_ENDPOINT;
const TABLE_PREFIX = process.env.TABLE_PREFIX ?? "dev_";

if (!isLocal) {
  console.error(
    "❌ reset-tables.ts está bloqueado contra AWS real.\n" +
      "   Si DE VERDAD quieres borrar en AWS, hazlo desde la consola.",
  );
  process.exit(1);
}

const client = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  endpoint: process.env.DYNAMODB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "local",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "local",
  },
});

async function main(): Promise<void> {
  const res = await client.send(new ListTablesCommand({}));
  const ours = (res.TableNames ?? []).filter((n) => n.startsWith(TABLE_PREFIX));

  if (ours.length === 0) {
    console.log("Nada que borrar.");
    return;
  }

  console.log(`🗑️  Borrando ${ours.length} tablas con prefijo "${TABLE_PREFIX}":`);
  for (const name of ours) {
    await client.send(new DeleteTableCommand({ TableName: name }));
    console.log(`  ✅ ${name}`);
  }
  console.log("\n✨ Reset completo.\n");
}

main().catch((err) => {
  console.error("\n❌ Error:", err);
  process.exit(1);
});
