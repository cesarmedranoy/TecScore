/**
 * /admin/auditoria — log de eventos de la plataforma.
 *
 * Guarda en: src/app/(admin)/admin/auditoria/page.tsx
 */

import { ScrollText, User, Calendar, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auditLogRepository } from "@/server/repositories/audit-log-repository";
import { userRepository } from "@/server/repositories/user-repository";
import { cn } from "@/lib/utils";
import type { AuditLogEntry } from "@/types";

// Colores y labels por acción
const ACTION_CONFIG: Record<string, { label: string; color: string }> = {
  MATCH_CREATE:        { label: "Partido creado",         color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  MATCH_RESULT_UPDATE: { label: "Resultado cargado",      color: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
  MATCH_STATUS_UPDATE: { label: "Estado actualizado",     color: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  EVENT_CREATE:        { label: "Evento creado",          color: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300" },
  EVENT_STATUS_UPDATE: { label: "Evento actualizado",     color: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300" },
  EVENT_RESOLVE:       { label: "Evento resuelto",        color: "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300" },
};

function getActionConfig(action: string) {
  return ACTION_CONFIG[action] ?? { label: action, color: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "ahora";
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

export default async function AdminAuditoriaPage() {
  const logs = await auditLogRepository.listRecent(100);

  // Enriquecer con nombre del actor
  const actorIds = [...new Set(logs.map((l) => l.actorId))];
  const actors = await Promise.all(
    actorIds.map(async (id) => {
      const u = await userRepository.getById(id);
      return { id, name: u?.displayName ?? "Sistema" };
    }),
  );
  const actorMap = new Map(actors.map((a) => [a.id, a.name]));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditoría</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Quién hizo qué, cuándo. Trazabilidad completa de acciones admin.
        </p>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="pt-16 pb-16 flex flex-col items-center text-center gap-3">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <ScrollText className="size-8" />
            </div>
            <h3 className="text-lg font-semibold">Log vacío</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Los eventos aparecerán acá a medida que se ejecuten acciones admin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4 pb-4 flex flex-col divide-y divide-border">
            {logs.map((log) => (
              <LogRow
                key={log.logId}
                log={log}
                actorName={actorMap.get(log.actorId) ?? "Sistema"}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LogRow({
  log,
  actorName,
}: {
  log: AuditLogEntry;
  actorName: string;
}) {
  const { label, color } = getActionConfig(log.action);

  return (
    <div className="flex items-start gap-4 py-3 px-2">
      {/* Ícono */}
      <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <ScrollText className="size-4 text-muted-foreground" />
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", color)}>
            {label}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Tag className="size-3" />
            {log.targetType} · {log.targetId.slice(0, 8)}…
          </span>
        </div>

        {/* Diff */}
        {log.diff && (
          <div className="mt-1.5 flex flex-wrap gap-2">
            {Object.entries(log.diff).map(([field, { from, to }]) => (
              <div key={field} className="text-[11px] bg-muted rounded-md px-2 py-1 font-mono">
                <span className="text-muted-foreground">{field}:</span>{" "}
                {from !== null && (
                  <span className="text-red-500 line-through">{String(from)}</span>
                )}
                {from !== null && " → "}
                <span className="text-emerald-600 dark:text-emerald-400">{String(to)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actor + fecha */}
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="size-3" />
            {actorName}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            {timeAgo(log.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}