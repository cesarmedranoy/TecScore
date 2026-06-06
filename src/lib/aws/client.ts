/**
 * Cliente DynamoDB con routing automático local/AWS.
 *
 * Cómo funciona:
 * - Si `DYNAMODB_ENDPOINT` está seteado en .env → usa DynamoDB Local (Docker)
 * - Si NO está seteado → usa AWS real con las credenciales de la cuenta
 *
 * Esto permite que el código sea idéntico en desarrollo y producción.
 * El AWS SDK v3 es modular: solo importamos lo que usamos para mantener el bundle ligero.
 *
 * Patrón "singleton": creamos el cliente una sola vez por proceso de Node.
 * En Next.js, las funciones serverless reutilizan el cliente entre invocaciones,
 * lo que reduce latencia (no hay handshake TCP cada vez).
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const isLocal = !!process.env.DYNAMODB_ENDPOINT;

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

/**
 * DocumentClient: wrapper de alto nivel que convierte automáticamente
 * entre objetos JS y el formato interno de DynamoDB (AttributeValues).
 *
 * Sin esto tendrías que escribir { S: "foo" } en vez de "foo" — mucho ruido.
 *
 * `marshallOptions.removeUndefinedValues`: previene errores cuando guardas
 * un objeto con campos opcionales `undefined` (DynamoDB rechazaría el item).
 */
export const ddb = DynamoDBDocumentClient.from(rawClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

export const isLocalDynamoDB = isLocal;
