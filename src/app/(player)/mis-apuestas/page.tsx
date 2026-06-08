/**
 * /mis-apuestas — todas las predicciones del jugador.
 *
 * Agrupa partidos en 3 secciones:
 *  1. Próximos (SCHEDULED) — donde puede predecir/editar
 *  2. En vivo (LIVE)
 *  3. Terminados (FINISHED) — con resultado + puntos ganados
 *
 * Si admin no creó partidos aún, empty state.
 */

import { redirect } from "next/navigation";
import { CalendarOff } from "lucide-react";
import { auth } from "@/auth";
import {
  matchRepository,
  predictionRepository,
  pointsRepository,
  groupMemberRepository,
} from "@/server/repositories";
import { Card, CardContent } from "@/components/ui/card";
import { MatchCard } from "./_components/match-card";
import type { Match, Prediction, PointEntry } from "@/types";

export default async function MisApuestasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [matches, predictions, points, groupCount] = await Promise.all([
    matchRepository.listAll(),
    predictionRepository.listByUser(session.user.userId),
    pointsRepository.listByUser(session.user.userId),
    groupMemberRepository.countByUser(session.user.userId),
  ]);
  const userInGroup = groupCount > 0;

  if (matches.length === 0) {
    return <EmptyState />;
  }

  // Index para acceso O(1)
  const predByMatch = new Map<string, Prediction>(
    predictions.map((p) => [p.matchId, p]),
  );
  const pointsByMatch = new Map<string, PointEntry>(
    points.map((p) => [p.matchId, p]),
  );

  // Ordenar por kickoff ascendente
  matches.sort(
    (a, b) =>
      new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
  );

  const upcoming = matches.filter((m) => m.status === "SCHEDULED");
  const live = matches.filter((m) => m.status === "LIVE");
  const finished = matches.filter((m) => m.status === "FINISHED").reverse();
  const other = matches.filter(
    (m) =>
      m.status === "SUSPENDED" ||
      m.status === "CANCELLED" ||
      m.status === "RESCHEDULED",
  );

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis apuestas</h1>
        <p className="text-muted-foreground mt-1">
          Todos los partidos del Mundial y tu predicción de cada uno.
        </p>
      </div>

      {live.length > 0 && (
        <Section title="En vivo" subtitle={`${live.length} partidos`}>
          {live.map((m) => (
            <MatchCard
              key={m.matchId}
              match={m}
              prediction={predByMatch.get(m.matchId)}
              userInGroup={userInGroup}
            />
          ))}
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section
          title="Próximos partidos"
          subtitle={`${upcoming.length} para predecir`}
        >
          {upcoming.map((m) => (
            <MatchCard
              key={m.matchId}
              match={m}
              prediction={predByMatch.get(m.matchId)}
              userInGroup={userInGroup}
            />
          ))}
        </Section>
      )}

      {finished.length > 0 && (
        <Section title="Terminados" subtitle={`${finished.length} jugados`}>
          {finished.map((m) => {
            const pe = pointsByMatch.get(m.matchId);
            return (
              <MatchCard
                key={m.matchId}
                match={m}
                prediction={predByMatch.get(m.matchId)}
                pointsEarned={pe?.amount}
                userInGroup={userInGroup}
              />
            );
          })}
        </Section>
      )}

      {other.length > 0 && (
        <Section title="Suspendidos / cancelados">
          {other.map((m) => (
            <MatchCard
              key={m.matchId}
              match={m}
              prediction={predByMatch.get(m.matchId)}
              userInGroup={userInGroup}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && (
          <span className="text-sm text-muted-foreground">{subtitle}</span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis apuestas</h1>
        <p className="text-muted-foreground mt-1">
          Todos los partidos del Mundial y tu predicción de cada uno.
        </p>
      </div>
      <Card>
        <CardContent className="pt-16 pb-16 flex flex-col items-center text-center gap-4">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <CalendarOff className="size-8" />
          </div>
          <div className="max-w-md">
            <h3 className="text-lg font-semibold">Todavía no hay partidos</h3>
            <p className="text-sm text-muted-foreground mt-1">
              El administrador va a cargar el fixture cuando se acerque el
              Mundial. Vení después y vas a poder predecir cada partido.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
