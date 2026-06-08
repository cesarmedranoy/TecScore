/**
 * MatchCard — tarjeta de un partido con la predicción del usuario.
 *
 * Visualiza tres estados:
 *  - SCHEDULED  → permite predecir / editar (si >10min al kickoff)
 *  - LIVE       → predicción bloqueada
 *  - FINISHED   → muestra resultado + comparación con la predicción
 *
 * Incluye banderas (emoji) de las dos selecciones para identificar
 * rápidamente al equipo. Animación sutil de hover con framer-motion.
 */

"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Lock, TrendingUp, Calendar, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PredictionDialog } from "./prediction-dialog";
import { acceptsPredictions } from "@/lib/scoring/match-state";
import { getFlag } from "@/lib/teams/flags";
import { cn } from "@/lib/utils";
import type { Match, Prediction } from "@/types";

interface MatchCardProps {
  match: Match;
  prediction?: Prediction;
  pointsEarned?: number;
  /** Si false, "Predecir" se ve deshabilitado con tooltip "Únete a un grupo". */
  userInGroup?: boolean;
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

export function MatchCard({
  match,
  prediction,
  pointsEarned,
  userInGroup = true,
}: MatchCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const canPredict = acceptsPredictions(match);
  const isFinished = match.status === "FINISHED";
  const isLive = match.status === "LIVE";
  const kickoffDate = new Date(match.kickoffAt);

  const homeFlag = getFlag(match.homeTeam);
  const awayFlag = getFlag(match.awayTeam);

  return (
    <>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Card
          elevation={isLive ? "glow" : isFinished ? "flat" : "raised"}
          className={cn(
            "relative overflow-hidden",
            isFinished && "opacity-95",
            isLive && "border-danger/40",
          )}
        >
          {isLive && (
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />
          )}
          <CardContent className="pt-4 pb-4 flex flex-col gap-3">
            {/* Header con stage y estado */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {match.stage.replace(/_/g, " ")}
              </span>
              <Badge variant={STATUS_VARIANT[match.status]}>
                {isLive && (
                  <span className="size-1.5 rounded-full bg-red-500 animate-pulse mr-1" />
                )}
                {STATUS_LABEL[match.status]}
              </Badge>
            </div>

            {/* Marcador / partido con banderas */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <div className="flex items-center justify-end gap-2 min-w-0">
                <span className="font-semibold truncate text-sm md:text-base">
                  {match.homeTeam}
                </span>
                <span className="text-2xl leading-none shrink-0">
                  {homeFlag}
                </span>
              </div>
              <div
                className={cn(
                  "px-3 py-1.5 rounded-md text-center font-mono text-lg md:text-xl font-bold tabular-nums shrink-0",
                  isFinished
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {match.homeScore !== undefined && match.awayScore !== undefined
                  ? `${match.homeScore} - ${match.awayScore}`
                  : "vs"}
              </div>
              <div className="flex items-center justify-start gap-2 min-w-0">
                <span className="text-2xl leading-none shrink-0">
                  {awayFlag}
                </span>
                <span className="font-semibold truncate text-sm md:text-base">
                  {match.awayTeam}
                </span>
              </div>
            </div>

            {/* Kickoff — suppressHydrationWarning porque Intl formatea
                ligeramente distinto en Node (server) vs browser (client). */}
            <div
              className="text-xs text-muted-foreground flex items-center justify-center gap-1.5"
              suppressHydrationWarning
            >
              <Calendar className="size-3" />
              {formatKickoff(kickoffDate)}
            </div>

            {/* Predicción */}
            <div className="border-t border-border pt-2.5 flex items-center justify-between gap-2 min-h-[36px]">
              {prediction ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground text-xs">
                    Tu predicción:
                  </span>
                  <span className="font-mono font-semibold tabular-nums">
                    {prediction.homeScore} - {prediction.awayScore}
                  </span>
                  {pointsEarned !== undefined && pointsEarned > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                    >
                      <Badge variant="accent">+{pointsEarned} pts</Badge>
                    </motion.div>
                  )}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Sin predicción todavía
                </span>
              )}

              {canPredict ? (
                userInGroup ? (
                  <Button size="sm" onClick={() => setDialogOpen(true)}>
                    {prediction ? <Pencil /> : <TrendingUp />}
                    {prediction ? "Editar" : "Predecir"}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    title="Únete a un grupo primero para empezar a predecir"
                  >
                    <Lock className="size-3" />
                    Únete a un grupo
                  </Button>
                )
              ) : !isFinished ? (
                <Badge variant="muted">
                  <Lock className="size-3" />
                  Cerrado
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
