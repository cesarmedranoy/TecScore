/**
 * Nombres de tablas centralizados.
 *
 * Usamos prefijo (env TABLE_PREFIX) para separar entornos en la misma cuenta AWS:
 *   - dev_Users       (desarrollo local)
 *   - staging_Users   (preview de Vercel)
 *   - prod_Users      (producción)
 *
 * Si el día de mañana queremos renombrar una tabla, lo hacemos solo aquí.
 * El resto del código siempre importa de este archivo.
 */

const prefix = process.env.TABLE_PREFIX ?? "dev_";

export const TABLES = {
  USERS: `${prefix}Users`,
  ADMIN_ALLOWLIST: `${prefix}AdminAllowlist`,
  GROUPS: `${prefix}Groups`,
  GROUP_MEMBERS: `${prefix}GroupMembers`,
  GROUP_REQUESTS: `${prefix}GroupRequests`,
  MATCHES: `${prefix}Matches`,
  PREDICTIONS: `${prefix}Predictions`,
  POINTS: `${prefix}Points`,
  FRIENDSHIPS: `${prefix}Friendships`,
  NOTIFICATIONS: `${prefix}Notifications`,
  CHAT_MESSAGES: `${prefix}ChatMessages`,
  AUDIT_LOG: `${prefix}AuditLog`,
  SPECIAL_EVENTS: `${prefix}SpecialEvents`,
} as const;

export type TableName = (typeof TABLES)[keyof typeof TABLES];
