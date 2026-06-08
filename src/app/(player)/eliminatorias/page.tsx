/**
 * /eliminatorias — bracket desde Octavos hasta Final.
 *
 * Lee los partidos de cada etapa y muestra el cuadro.
 * Cuando admin todavía no cargó la etapa, muestra slots "Por definir".
 */

import { redirect } from "next/navigation";
import { Trophy, Medal } from "lucide-react";
import { auth } from "@/auth";
import {
  matchRepository,
  predictionRepository,
  groupMemberRepository,
} from "@/server/repositories";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchCard } from "../mis-apuestas/_components/match-card";
import type { Match, Stage, Prediction } from "@/types";

const STAGES_ORDER: Stage[] = [
  "ROUND_OF_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
];

const STAGE_LABELS: Record<Stage, string> = {
  GROUP: "Fase de grupos",
  ROUND_OF_16: "Octavos de final",
  QUARTER_FINALS: "Cuartos de final",
  SEMI_FINALS: "Semifinales",
  THIRD_PLACE: "Tercer puesto",
  FINAL: "Final",
};

const STAGE_EXPECTED_COUNT: Record<Stage, number> = {
  GROUP: 48,
  ROUND_OF_16: 8,
  QUARTER_FINALS: 4,
  SEMI_FINALS: 2,
  THIRD_PLACE: 1,
  FINAL: 1,
};

export default async function EliminatoriasPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [allMatches, predictions, groupCount] = await Promise.all([
    matchRepository.listAll(),
    predictionRepository.listByUser(session.user.userId),
    groupMemberRepository.countByUser(session.user.userId),
  ]);
  const userInGroup = groupCount > 0;

  const predByMatch = new Map<string, Prediction>(
    predictions.map((p) => [p.matchId, p]),
  );

  const byStage: Record<Stage, Match[]> = {
    GROUP: [],
    ROUND_OF_16: [],
    QUARTER_FINALS: [],
    SEMI_FINALS: [],
    THIRD_PLACE: [],
    FINAL: [],
  };
  for (const m of allMatches) byStage[m.stage].push(m);
  for (const stage of STAGES_ORDER) {
    byStage[stage].sort(
      (a, b) =>
        new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 text-white">
        <div className="absolute right-8 top-8 size-32 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-2 max-w-2xl">
            <Badge className="self-start bg-amber-500/20 text-amber-200 border-amber-400/30">
              Fase de eliminación directa
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Trophy className="size-9 text-amber-400" />
              Camino a la final
            </h1>
            <p className="text-zinc-300">
              Desde octavos de final hasta levantar la copa. Predecí cada
              partido para ganar puntos extra en la etapa más vibrante.
            </p>
          </div>
        </div>
      </section>

      {/* Etapas */}
      {STAGES_ORDER.map((stage) => (
        <StageSection
          key={stage}
          stage={stage}
          matches={byStage[stage]}
          predictions={predByMatch}
          userInGroup={userInGroup}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Componentes locales
// ============================================================================

function StageSection({
  stage,
  matches,
  predictions,
  userInGroup,
}: {
  stage: Stage;
  matches: Match[];
  predictions: Map<string, Prediction>;
  userInGroup: boolean;
}) {
  const expected = STAGE_EXPECTED_COUNT[stage];
  const missing = Math.max(0, expected - matches.length);
  const cols =
    stage === "ROUND_OF_16"
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      : stage === "QUARTER_FINALS"
        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
        : stage === "SEMI_FINALS"
          ? "grid-cols-1 md:grid-cols-2"
          : "grid-cols-1 md:grid-cols-2";

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <StageIcon stage={stage} />
          <h2 className="text-2xl font-bold tracking-tight">
            {STAGE_LABELS[stage]}
          </h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {matches.length} de {expected} partidos cargados
        </span>
      </div>
      <div className={`grid gap-4 ${cols}`}>
        {matches.map((m) => (
          <MatchCard
            key={m.matchId}
            match={m}
            prediction={predictions.get(m.matchId)}
            userInGroup={userInGroup}
          />
        ))}
        {Array.from({ length: missing }).map((_, idx) => (
          <PendingSlot key={`pending-${stage}-${idx}`} stage={stage} />
        ))}
      </div>
    </section>
  );
}

function StageIcon({ stage }: { stage: Stage }) {
  if (stage === "FINAL")
    return (
      <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
        <Trophy className="size-5" />
      </div>
    );
  if (stage === "THIRD_PLACE")
    return (
      <div className="size-10 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
        <Medal className="size-5" />
      </div>
    );
  return (
    <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
      <Medal className="size-5" />
    </div>
  );
}

function PendingSlot({ stage }: { stage: Stage }) {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-10 pb-10 flex flex-col items-center text-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {STAGE_LABELS[stage]}
        </span>
        <p className="text-sm text-muted-foreground">Por definir</p>
        <p className="text-xs text-muted-foreground/70">
          El admin cargará este partido
        </p>
      </CardContent>
    </Card>
  );
}
