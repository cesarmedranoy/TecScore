/**
 * AuditLogRepository — tabla AuditLog.
 *
 * Guarda en: src/server/repositories/audit-log-repository.ts
 */

import { PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { ddb } from "@/lib/aws/client";
import { TABLES } from "@/lib/aws/tables";
import { newId, now } from "@/lib/utils";
import type { AuditLogEntry } from "@/types";

export const auditLogRepository = {
  async create(entry: Omit<AuditLogEntry, "logId" | "timestamp">): Promise<void> {
    const item: AuditLogEntry = {
      ...entry,
      logId: newId(),
      timestamp: now(),
    };
    await ddb.send(
      new PutCommand({ TableName: TABLES.AUDIT_LOG, Item: item }),
    );
  },

  /** Lista los últimos N eventos ordenados por fecha desc. */
  async listRecent(limit = 50): Promise<AuditLogEntry[]> {
    const res = await ddb.send(
      new ScanCommand({
        TableName: TABLES.AUDIT_LOG,
        Limit: limit * 3, // over-fetch porque Scan no garantiza orden
      }),
    );
    const items = (res.Items as AuditLogEntry[]) ?? [];
    return items
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  },

  /** Lista eventos de un actor específico. */
  async listByActor(actorId: string, limit = 50): Promise<AuditLogEntry[]> {
    const res = await ddb.send(
      new QueryCommand({
        TableName: TABLES.AUDIT_LOG,
        IndexName: "byActor",
        KeyConditionExpression: "actorId = :a",
        ExpressionAttributeValues: { ":a": actorId },
        ScanIndexForward: false,
        Limit: limit,
      }),
    );
    return (res.Items as AuditLogEntry[]) ?? [];
  },
};