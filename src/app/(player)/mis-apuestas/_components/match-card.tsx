/**
 * MatchCard — preview de un partido con la predicción del usuario.
 *
 * Visualiza tres estados:
 *  - SCHEDULED  → permite predecir / editar (si >10min al kickoff)
 *  - LIVE       → predicción bloqueada
 *  - FINISHED   → muestra resultado + comparación con la predicción
 */

"use client";

import { useState } from "react";
import { Lock, TrendingUp, Calendar, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PredictionDialog } from "./prediction-dialog";
import { acceptsPredictions } from "@/lib/scoring/match-state";
import { cn } from "@/lib/utils";
import type { Match, Prediction } from "@/types";

interface MatchCardProps {
  match: Match;
  prediction?: Prediction;
  pointsEarned?: number;
}

const STATUS_LABEL = {
  SCHEDULED: "Programado",
  LIVE: "En vivo",
  FINISHED: "Terminado",
  SUSPENDED: "Suspendido",
  CANCELLED: "Cancelado",
  RESCHEDULED: "Reprogramado",
} as const;

const STATUS_VARIANT = {
  SCHEDULED: "outline",
  LIVE: "danger",
  FINISHED: "muted",
  SUSPENDED: "muted",
  CANCELLED: "danger",
  RESCHEDULED: "outline",
} as const;

export function MatchCard({ match, prediction, pointsEarned }: MatchCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const canPredict = acceptsPredictions(match);
  const isFinished = match.status === "FINISHED";
  const kickoffDate = new Date(match.kickoffAt);

  return (
    <>
      <Card elevation={isFinished ? "flat" : "raised"} className={cn(isFinished && "opacity-90")}>
        <CardContent className="pt-5 pb-5 flex flex-col gap-4">
          {/* Header con stage y estado */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {match.stage.replace(/_/g, " ")}
            </span>
            <Badge variant={STATUS_VARIANT[match.status]}>
              {STATUS_LABEL[match.status]}
            </Badge>
          </div>

          {/* Marcador / partido */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="text-right">
              <p className="font-semibold truncate">{match.homeTeam}</p>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-muted text-center font-mono text-xl font-bold tabular-nums">
              {match.homeScore !== undefined && match.awayScore !== undefined
                ? `${match.homeScore} - ${match.awayScore}`
                : "vs"}
            </div>
            <div className="text-left">
              <p className="font-semibold truncate">{match.awayTeam}</p>
            </div>
          </div>

          {/* Kickoff */}
          <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Calendar className="size-3" />
            {formatKickoff(kickoffDate)}
          </div>

          {/* Predicción */}
          <div className="border-t border-border pt-3 flex items-center justify-between gap-2">
            {prediction ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Tu predicción:</span>
                <span className="font-mono font-semibold tabular-nums">
                  {prediction.homeScore} - {prediction.awayScore}
                </span>
                {pointsEarned !== undefined && pointsEarned > 0 && (
                  <Badge variant="accent">+{pointsEarned} pts</Badge>
                )}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                Sin predicción
              </span>
            )}

            {canPredict ? (
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                {prediction ? <Pencil /> : <TrendingUp />}
                {prediction ? "Editar" : "Predecir"}
              </Button>
            ) : !isFinished ? (
              <Badge variant="muted">
                <Lock className="size-3" />
                Cerrado
              </Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {canPredict && (
        <PredictionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          match={match}
          current={prediction}
        />
      )}
    </>
  );
}

function formatKickoff(date: Date): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
