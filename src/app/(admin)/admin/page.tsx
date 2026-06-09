/**
 * /admin — dashboard global del administrador.
 */

import {
  Users,
  UserCheck,
  Calendar,
  CalendarCheck,
  CalendarClock,
  Layers,
  TrendingUp,
  AlertCircle,
  ScrollText,
  Star,
} from "lucide-react";
import {
  matchRepository,
} from "@/server/repositories";
import { ddb } from "@/lib/aws/client";
import { TABLES } from "@/lib/aws/tables";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { auditLogRepository } from "@/server/repositories/audit-log-repository";
import { userRepository } from "@/server/repositories/user-repository";
import { specialEventRepository } from "@/server/repositories/special-event-repository";
import Link from "next/link";

async function countTable(tableName: string): Promise<number> {
  const res = await ddb.send(
    new ScanCommand({ TableName: tableName, Select: "COUNT" }),
  );
  return res.Count ?? 0;
}

const ACTION_LABELS: Record<string, string> = {
  MATCH_CREATE:        "Partido creado",
  MATCH_RESULT_UPDATE: "Resultado cargado",
  MATCH_STATUS_UPDATE: "Estado actualizado",
  EVENT_CREATE:        "Evento creado",
  EVENT_STATUS_UPDATE: "Evento actualizado",
  EVENT_RESOLVE:       "Evento resuelto",
};

export default async function AdminDashboardPage() {
  const [
    allMatches,
    userCount,
    groupCount,
    predictionCount,
    pointEntryCount,
    recentLogs,
    activeEvents,
  ] = await Promise.all([
    matchRepository.listAll(),
    countTable(TABLES.USERS),
    countTable(TABLES.GROUPS),
    countTable(TABLES.PREDICTIONS),
    countTable(TABLES.POINTS),
    auditLogRepository.listRecent(5),
    specialEventRepository.listByStatus("ACTIVE"),
  ]);

  const scheduled      = allMatches.filter((m) => m.status === "SCHEDULED").length;
  const live           = allMatches.filter((m) => m.status === "LIVE").length;
  const finished       = allMatches.filter((m) => m.status === "FINISHED").length;
  const finishedUnscored = allMatches.filter(
    (m) => m.status === "FINISHED" && !m.scored,
  ).length;

  // Enriquecer logs con nombre del actor
  const actorIds = [...new Set(recentLogs.map((l) => l.actorId))];
  const actors = await Promise.all(
    actorIds.map(async (id) => {
      const u = await userRepository.getById(id);
      return { id, name: u?.displayName ?? "Sistema" };
    }),
  );
  const actorMap = new Map(actors.map((a) => [a.id, a.name]));

  // Próximos 5 partidos
  const upcoming = allMatches
    .filter((m) => m.status === "SCHEDULED")
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resumen general</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Estado actual de la plataforma en tiempo real.
        </p>
      </div>

      {/* Alerta partidos sin scoring */}
      {finishedUnscored > 0 && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-amber-700 dark:text-amber-400 shrink-0" />
            <p className="text-sm text-amber-900 dark:text-amber-200">
              Hay <strong>{finishedUnscored}</strong> partido(s) terminados sin
              scoring procesado. Revisá la sección de partidos.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Eventos especiales activos */}
      {activeEvents.length > 0 && (
        <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800">
          <CardContent className="pt-4 flex items-center gap-3">
            <Star className="size-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-900 dark:text-emerald-200 flex-1">
              <strong>{activeEvents.length}</strong> evento(s) especial(es) activo(s) —{" "}
              {activeEvents.map((e) => e.title).join(", ")}
            </p>
            <Link
              href="/admin/eventos"
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0"
            >
              Gestionar →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats plataforma */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Plataforma
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users}      label="Usuarios totales"     value={userCount}       accent="emerald" />
          <StatCard icon={Layers}     label="Grupos activos"       value={groupCount}      accent="amber" />
          <StatCard icon={TrendingUp} label="Predicciones totales" value={predictionCount} accent="orange" />
          <StatCard icon={UserCheck}  label="Puntos repartidos"    value={pointEntryCount} accent="zinc" />
        </div>
      </section>

      {/* Stats partidos */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Partidos
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={Calendar}
            label="Total cargados"
            value={allMatches.length}
            sublabel="104 esperados"
            accent="zinc"
          />
          <StatCard icon={CalendarClock} label="Programados" value={scheduled} accent="emerald" />
          <StatCard icon={CalendarCheck} label="En vivo"     value={live}      accent="orange" />
          <StatCard
            icon={CalendarCheck}
            label="Terminados"
            value={finished}
            sublabel={finishedUnscored > 0 ? `${finishedUnscored} pendientes` : "Todos scoreados"}
            accent={finishedUnscored > 0 ? "amber" : "emerald"}
          />
        </div>
      </section>

      {/* Próximos partidos + Actividad reciente — 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Próximos partidos */}
        {upcoming.length > 0 && (
          <section className="flex flex-col gap-2.5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Próximos a jugarse
            </h2>
            <Card className="flex-1">
              <CardContent className="pt-4 flex flex-col gap-1">
                {upcoming.map((m) => (
                  <div
                    key={m.matchId}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="text-xs font-mono text-muted-foreground"
                        suppressHydrationWarning
                      >
                        {new Date(m.kickoffAt).toLocaleString("es", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                      <span className="font-medium truncate text-sm">
                        {m.homeTeam} vs {m.awayTeam}
                      </span>
                    </div>
                    <Badge variant="outline">{m.stage.replace(/_/g, " ")}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Actividad reciente de auditoría */}
        <section className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Actividad reciente
            </h2>
            <Link
              href="/admin/auditoria"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver todo →
            </Link>
          </div>
          <Card className="flex-1">
            <CardContent className="pt-4 flex flex-col gap-1">
              {recentLogs.length === 0 ? (
                <div className="flex items-center gap-3 px-3 py-8 text-center justify-center">
                  <ScrollText className="size-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Sin actividad aún</p>
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.logId}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50"
                  >
                    <ScrollText className="size-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        por {actorMap.get(log.actorId) ?? "Sistema"}
                      </p>
                    </div>
                    <span
                      className="text-[10px] text-muted-foreground shrink-0"
                      suppressHydrationWarning
                    >
                      {timeAgo(log.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "ahora";
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sublabel?: string;
  accent: "amber" | "orange" | "emerald" | "zinc";
}) {
  const accents = {
    amber:   "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    orange:  "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    zinc:    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  } as const;

  return (
    <Card elevation="raised">
      <CardContent className="pt-4 pb-4 flex items-center gap-3">
        <div className={cn("size-10 rounded-lg flex items-center justify-center shrink-0", accents[accent])}>
          <Icon className="size-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
            {label}
          </span>
          <span className="text-xl font-bold tabular-nums leading-tight">
            {value.toLocaleString("es-PE")}
          </span>
          {sublabel && (
            <span className="text-[10px] text-muted-foreground">{sublabel}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}