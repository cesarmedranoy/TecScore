/**
 * /admin — dashboard global del administrador.
 *
 * Métricas: usuarios totales, partidos por estado, grupos activos,
 * predicciones totales, partidos pendientes de scoring.
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
} from "lucide-react";
import {
  matchRepository,
  groupRepository,
} from "@/server/repositories";
import { ddb } from "@/lib/aws/client";
import { TABLES } from "@/lib/aws/tables";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

async function countTable(tableName: string): Promise<number> {
  const res = await ddb.send(
    new ScanCommand({ TableName: tableName, Select: "COUNT" }),
  );
  return res.Count ?? 0;
}

export default async function AdminDashboardPage() {
  const [
    allMatches,
    userCount,
    groupCount,
    predictionCount,
    pointEntryCount,
  ] = await Promise.all([
    matchRepository.listAll(),
    countTable(TABLES.USERS),
    countTable(TABLES.GROUPS),
    countTable(TABLES.PREDICTIONS),
    countTable(TABLES.POINTS),
  ]);

  const scheduled = allMatches.filter((m) => m.status === "SCHEDULED").length;
  const live = allMatches.filter((m) => m.status === "LIVE").length;
  const finished = allMatches.filter((m) => m.status === "FINISHED").length;
  const finishedUnscored = allMatches.filter(
    (m) => m.status === "FINISHED" && !m.scored,
  ).length;

  // Próximos 5 partidos
  const upcoming = allMatches
    .filter((m) => m.status === "SCHEDULED")
    .sort(
      (a, b) =>
        new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resumen general</h1>
        <p className="text-muted-foreground mt-1">
          Estado actual de la plataforma en tiempo real.
        </p>
      </div>

      {/* Alerta de partidos pendientes de scoring */}
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

      {/* Stats principales */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Plataforma
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Usuarios totales"
            value={userCount}
            accent="emerald"
          />
          <StatCard
            icon={Layers}
            label="Grupos activos"
            value={groupCount}
            accent="amber"
          />
          <StatCard
            icon={TrendingUp}
            label="Predicciones totales"
            value={predictionCount}
            accent="orange"
          />
          <StatCard
            icon={UserCheck}
            label="Puntos repartidos"
            value={pointEntryCount}
            accent="zinc"
          />
        </div>
      </section>

      {/* Estado de partidos */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Partidos
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Calendar}
            label="Total cargados"
            value={allMatches.length}
            sublabel="64 esperados"
            accent="zinc"
          />
          <StatCard
            icon={CalendarClock}
            label="Programados"
            value={scheduled}
            accent="emerald"
          />
          <StatCard
            icon={CalendarCheck}
            label="En vivo"
            value={live}
            accent="orange"
          />
          <StatCard
            icon={CalendarCheck}
            label="Terminados"
            value={finished}
            sublabel={finishedUnscored > 0 ? `${finishedUnscored} pendientes` : "Todos scoreados"}
            accent={finishedUnscored > 0 ? "amber" : "emerald"}
          />
        </div>
      </section>

      {/* Próximos partidos */}
      {upcoming.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Próximos a jugarse
          </h2>
          <Card>
            <CardContent className="pt-6 flex flex-col gap-1">
              {upcoming.map((m) => (
                <div
                  key={m.matchId}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground">
                      {new Date(m.kickoffAt).toLocaleString("es", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                    <span className="font-medium truncate">
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
    </div>
  );
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
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    orange:
      "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    emerald:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  } as const;

  return (
    <Card elevation="raised">
      <CardContent className="pt-6 flex items-center gap-4">
        <div
          className={cn(
            "size-12 rounded-xl flex items-center justify-center",
            accents[accent],
          )}
        >
          <Icon className="size-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {label}
          </span>
          <span className="text-2xl font-bold tabular-nums">
            {value.toLocaleString("es")}
          </span>
          {sublabel && (
            <span className="text-xs text-muted-foreground">{sublabel}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
