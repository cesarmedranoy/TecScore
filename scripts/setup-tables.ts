/**
 * Crea todas las tablas de TecScore en DynamoDB.
 *
 * Funciona idénticamente en:
 *  - DynamoDB Local (Docker) si DYNAMODB_ENDPOINT está seteado
 *  - AWS real si no lo está
 *
 * Idempotente: si una tabla ya existe, la salta sin error.
 *
 * Uso:
 *   npm run db:setup
 *
 * También insemina el AdminAllowlist con el email de Julio si está vacío.
 */

import {
  CreateTableCommand,
  DescribeTableCommand,
  ResourceInUseException,
  type CreateTableCommandInput,
  type KeySchemaElement,
  type AttributeDefinition,
  type GlobalSecondaryIndex,
} from "@aws-sdk/client-dynamodb";
import { PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { config as loadEnv } from "dotenv";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Cargar variables de entorno desde .env.local
loadEnv({ path: ".env.local" });

const isLocal = !!process.env.DYNAMODB_ENDPOINT;
const TABLE_PREFIX = process.env.TABLE_PREFIX ?? "dev_";
const ADMIN_EMAIL = "julio.medrano@tecsup.edu.pe";

const rawClient = new DynamoDBClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  ...(isLocal && {
    endpoint: process.env.DYNAMODB_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "local",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "local",
    },
  }),
});
const ddb = DynamoDBDocumentClient.from(rawClient);

// ============================================================================
// Helpers
// ============================================================================

/** Construye un input estándar de CreateTable. Reduce repetición. */
function buildTable(
  name: string,
  keys: KeySchemaElement[],
  attrs: AttributeDefinition[],
  gsis?: GlobalSecondaryIndex[],
): CreateTableCommandInput {
  return {
    TableName: `${TABLE_PREFIX}${name}`,
    KeySchema: keys,
    AttributeDefinitions: attrs,
    BillingMode: "PAY_PER_REQUEST",
    ...(gsis && gsis.length > 0 && { GlobalSecondaryIndexes: gsis }),
  };
}

/** Crea una tabla; si ya existe, lo informa y continúa. */
async function createIfNotExists(input: CreateTableCommandInput): Promise<void> {
  const name = input.TableName!;
  try {
    await rawClient.send(new CreateTableCommand(input));
    console.log(`  ✅ ${name}`);
  } catch (err) {
    if (err instanceof ResourceInUseException) {
      console.log(`  ⏭️  ${name} (ya existe)`);
      return;
    }
    throw err;
  }
}

// ============================================================================
// Definiciones de tablas
// ============================================================================

const tables: CreateTableCommandInput[] = [
  // Users — PK userId, GSI byEmail para login con Google
  buildTable(
    "Users",
    [{ AttributeName: "userId", KeyType: "HASH" }],
    [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "email", AttributeType: "S" },
    ],
    [
      {
        IndexName: "byEmail",
        KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  ),

  // AdminAllowlist — PK email, sin GSI. Lookup directo por email en login.
  buildTable(
    "AdminAllowlist",
    [{ AttributeName: "email", KeyType: "HASH" }],
    [{ AttributeName: "email", AttributeType: "S" }],
  ),

  // Groups — PK groupId, GSI byCode (para unirse con código) y byOwner
  buildTable(
    "Groups",
    [{ AttributeName: "groupId", KeyType: "HASH" }],
    [
      { AttributeName: "groupId", AttributeType: "S" },
      { AttributeName: "joinCode", AttributeType: "S" },
      { AttributeName: "ownerId", AttributeType: "S" },
    ],
    [
      {
        IndexName: "byCode",
        KeySchema: [{ AttributeName: "joinCode", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
      {
        IndexName: "byOwner",
        KeySchema: [{ AttributeName: "ownerId", KeyType: "HASH" }],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  ),

  // GroupMembers — PK groupId, SK userId. GSI byUser para "mis grupos".
  buildTable(
    "GroupMembers",
    [
      { AttributeName: "groupId", KeyType: "HASH" },
      { AttributeName: "userId", KeyType: "RANGE" },
    ],
    [
      { AttributeName: "groupId", AttributeType: "S" },
      { AttributeName: "userId", AttributeType: "S" },
    ],
    [
      {
        IndexName: "byUser",
        KeySchema: [
          { AttributeName: "userId", KeyType: "HASH" },
          { AttributeName: "groupId", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  ),

  // GroupRequests — solicitudes a grupos privados con TTL de 12h
  buildTable(
    "GroupRequests",
    [
      { AttributeName: "groupId", KeyType: "HASH" },
      { AttributeName: "userId", KeyType: "RANGE" },
    ],
    [
      { AttributeName: "groupId", AttributeType: "S" },
      { AttributeName: "userId", AttributeType: "S" },
    ],
  ),

  // Matches — PK matchId, GSI byStatus (para "próximos partidos")
  buildTable(
    "Matches",
    [{ AttributeName: "matchId", KeyType: "HASH" }],
    [
      { AttributeName: "matchId", AttributeType: "S" },
      { AttributeName: "status", AttributeType: "S" },
      { AttributeName: "kickoffAt", AttributeType: "S" },
    ],
    [
      {
        IndexName: "byStatus",
        KeySchema: [
          { AttributeName: "status", KeyType: "HASH" },
          { AttributeName: "kickoffAt", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  ),

  // Predictions — PK userId, SK matchId. GSI byMatch (para scoring batch).
  buildTable(
    "Predictions",
    [
      { AttributeName: "userId", KeyType: "HASH" },
      { AttributeName: "matchId", KeyType: "RANGE" },
    ],
    [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "matchId", AttributeType: "S" },
    ],
    [
      {
        IndexName: "byMatch",
        KeySchema: [
          { AttributeName: "matchId", KeyType: "HASH" },
          { AttributeName: "userId", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  ),

  // Points — PK userId, SK matchId. Historial inmutable de puntos otorgados.
  buildTable(
    "Points",
    [
      { AttributeName: "userId", KeyType: "HASH" },
      { AttributeName: "matchId", KeyType: "RANGE" },
    ],
    [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "matchId", AttributeType: "S" },
    ],
  ),

  // Friendships — PK userId, SK friendId. Bidireccional (guardamos 2 items).
  buildTable(
    "Friendships",
    [
      { AttributeName: "userId", KeyType: "HASH" },
      { AttributeName: "friendId", KeyType: "RANGE" },
    ],
    [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "friendId", AttributeType: "S" },
    ],
  ),

  // Notifications — PK userId, SK notifId (ULID, ordenable por fecha)
  buildTable(
    "Notifications",
    [
      { AttributeName: "userId", KeyType: "HASH" },
      { AttributeName: "notifId", KeyType: "RANGE" },
    ],
    [
      { AttributeName: "userId", AttributeType: "S" },
      { AttributeName: "notifId", AttributeType: "S" },
    ],
  ),

  // ChatMessages — PK groupId, SK messageId (ULID ordenable cronológicamente)
  buildTable(
    "ChatMessages",
    [
      { AttributeName: "groupId", KeyType: "HASH" },
      { AttributeName: "messageId", KeyType: "RANGE" },
    ],
    [
      { AttributeName: "groupId", AttributeType: "S" },
      { AttributeName: "messageId", AttributeType: "S" },
    ],
  ),

  // AuditLog — PK logId, GSI byActor para "todas las acciones de Julio admin"
  buildTable(
    "AuditLog",
    [
      { AttributeName: "logId", KeyType: "HASH" },
      { AttributeName: "timestamp", KeyType: "RANGE" },
    ],
    [
      { AttributeName: "logId", AttributeType: "S" },
      { AttributeName: "timestamp", AttributeType: "S" },
      { AttributeName: "actorId", AttributeType: "S" },
    ],
    [
      {
        IndexName: "byActor",
        KeySchema: [
          { AttributeName: "actorId", KeyType: "HASH" },
          { AttributeName: "timestamp", KeyType: "RANGE" },
        ],
        Projection: { ProjectionType: "ALL" },
      },
    ],
  ),
];

// ============================================================================
// Seed: insertar email admin si AdminAllowlist está vacío
// ============================================================================

async function seedAdminIfEmpty(): Promise<void> {
  const tableName = `${TABLE_PREFIX}AdminAllowlist`;
  const existing = await ddb.send(
    new ScanCommand({ TableName: tableName, Limit: 1 }),
  );
  if (existing.Items && existing.Items.length > 0) {
    console.log(`  ⏭️  AdminAllowlist ya tiene admins (skip seed)`);
    return;
  }
  await ddb.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        email: ADMIN_EMAIL,
        addedAt: new Date().toISOString(),
        addedBy: "bootstrap",
      },
    }),
  );
  console.log(`  ✅ Admin sembrado: ${ADMIN_EMAIL}`);
}

// ============================================================================
// Espera a que una tabla esté ACTIVE antes de hacer puts (DynamoDB Local
// es instantáneo, pero AWS real puede tardar varios segundos).
// ============================================================================

async function waitForTable(name: string, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await rawClient.send(
        new DescribeTableCommand({ TableName: name }),
      );
      if (res.Table?.TableStatus === "ACTIVE") return;
    } catch {
      // tabla todavía no aparece, esperamos
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Tabla ${name} no llegó a ACTIVE en ${maxAttempts}s`);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  console.log(`\n🚀 Setup de tablas TecScore`);
  console.log(`   Destino: ${isLocal ? "DynamoDB Local" : "AWS DynamoDB"}`);
  console.log(`   Región:  ${process.env.AWS_REGION ?? "us-east-1"}`);
  console.log(`   Prefijo: ${TABLE_PREFIX}\n`);

  console.log(`📦 Creando ${tables.length} tablas:`);
  for (const t of tables) {
    await createIfNotExists(t);
  }

  console.log(`\n⏳ Esperando que AdminAllowlist esté ACTIVE...`);
  await waitForTable(`${TABLE_PREFIX}AdminAllowlist`);

  console.log(`\n🌱 Seeding admin:`);
  await seedAdminIfEmpty();

  console.log(`\n✨ Setup completo.\n`);
}

main().catch((err) => {
  console.error("\n❌ Error en setup:", err);
  process.exit(1);
});
