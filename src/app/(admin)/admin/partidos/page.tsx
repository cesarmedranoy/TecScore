/**
 * /admin/partidos — gestión de partidos.
 *
 * Tabla con: equipos, fecha, etapa, estado, resultado, acciones.
 * Acciones disponibles: marcar resultado (dispara scoring), cambiar status.
 */

import { Calendar } from "lucide-react";
import { matchRepository } from "@/server/repositories";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateMatchDialog } from "./_components/create-match-dialog";
import { ResultDialog } from "./_components/result-dialog";

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: "Programado",
  LIVE: "En vivo",
  FINISHED: "Terminado",
  SUSPENDED: "Suspendido",
  CANCELLED: "Cancelado",
  RESCHEDULED: "Reprogramado",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "accent" | "muted" | "danger" | "outline"
> = {
  SCHEDULED: "outline",
  LIVE: "accent",
  FINISHED: "muted",
  SUSPENDED: "muted",
  CANCELLED: "danger",
  RESCHEDULED: "outline",
};

export default async function AdminPartidosPage() {
  const matches = await matchRepository.listAll();
  matches.sort(
    (a, b) =>
      new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partidos</h1>
          <p className="text-muted-foreground mt-1">
            Cargá el fixture y marcá resultados para disparar el scoring.
          </p>
        </div>
        <CreateMatchDialog />
      </div>

      {matches.length === 0 ? (
        <EmptyState />
      ) : (
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-3 py-3">Fecha</th>
                  <th className="px-3 py-3">Etapa</th>
                  <th className="px-3 py-3">Local</th>
                  <th className="px-3 py-3 text-center">Resultado</th>
                  <th className="px-3 py-3">Visitante</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr
                    key={m.matchId}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-3 py-3 text-xs font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(m.kickoffAt).toLocaleString("es", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant="outline">
                        {m.stage.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 font-medium">{m.homeTeam}</td>
                    <td className="px-3 py-3 text-center font-mono font-bold tabular-nums">
                      {m.homeScore !== undefined && m.awayScore !== undefined
                        ? `${m.homeScore} - ${m.awayScore}`
                        : "—"}
                    </td>
                    <td className="px-3 py-3 font-medium">{m.awayTeam}</td>
                    <td className="px-3 py-3">
                      <Badge variant={STATUS_VARIANT[m.status]}>
                        {STATUS_LABEL[m.status]}
                      </Badge>
                      {m.status === "FINISHED" && !m.scored && (
                        <Badge variant="danger" className="ml-1">
                          Sin scoring
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {(m.status === "SCHEDULED" ||
                        m.status === "LIVE" ||
                        m.status === "SUSPENDED") && (
                        <ResultDialog match={m} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="pt-16 pb-16 flex flex-col items-center text-center gap-3">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <Calendar className="size-8" />
        </div>
        <h3 className="text-lg font-semibold">Todavía no hay partidos cargados</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Click en "Crear partido" para cargar el primer encuentro del fixture.
        </p>
      </CardContent>
    </Card>
  );
}
