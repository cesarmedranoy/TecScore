/**
 * PredictionDialog — modal para predecir/editar el marcador de un partido.
 *
 * Al confirmar exitosamente:
 *  1. Lanza confetti con balones (canvas-confetti)
 *  2. Muestra estado de éxito animado
 *  3. Cierra el dialog tras 1.5s
 */

"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Minus, Plus, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { submitPredictionAction, type PredictionActionState } from "../actions";
import { celebratePrediction } from "@/lib/effects/celebrate";
import { getFlag } from "@/lib/teams/flags";
import type { Match, Prediction } from "@/types";

const initialState: PredictionActionState = {};

interface PredictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: Match;
  current?: Prediction;
}

export function PredictionDialog({
  open,
  onOpenChange,
  match,
  current,
}: PredictionDialogProps) {
  const [state, action] = useActionState(submitPredictionAction, initialState);
  const [home, setHome] = useState(current?.homeScore ?? 1);
  const [away, setAway] = useState(current?.awayScore ?? 1);
  const [celebrated, setCelebrated] = useState(false);

  // Disparar confetti cuando llega success y cerrar tras animación
  useEffect(() => {
    if (state.success && !celebrated) {
      celebratePrediction();
      setCelebrated(true);
      const t = setTimeout(() => {
        onOpenChange(false);
        setCelebrated(false);
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [state.success, celebrated, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Predecir marcador</DialogTitle>
          <DialogDescription>
            <span className="text-base">
              {getFlag(match.homeTeam)} {match.homeTeam} vs {match.awayTeam}{" "}
              {getFlag(match.awayTeam)}
            </span>
            <br />
            <span className="text-xs">
              Tip: predecir &gt;24h antes del kickoff suma +1 pt extra.
            </span>
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {celebrated ? (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="flex flex-col items-center justify-center gap-4 py-10"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ duration: 0.6 }}
              >
                <CheckCircle2 className="size-20 text-success" />
              </motion.div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-success">
                  ¡Apuesta registrada!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {home} - {away}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={false}
              action={action}
              className="flex flex-col gap-6"
            >
              <input type="hidden" name="matchId" value={match.matchId} />
              <input type="hidden" name="homeScore" value={home} />
              <input type="hidden" name="awayScore" value={away} />

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <TeamScore
                  team={match.homeTeam}
                  flag={getFlag(match.homeTeam)}
                  score={home}
                  onIncrement={() => setHome((s) => Math.min(20, s + 1))}
                  onDecrement={() => setHome((s) => Math.max(0, s - 1))}
                />
                <span className="text-muted-foreground text-2xl font-bold">
                  :
                </span>
                <TeamScore
                  team={match.awayTeam}
                  flag={getFlag(match.awayTeam)}
                  score={away}
                  onIncrement={() => setAway((s) => Math.min(20, s + 1))}
                  onDecrement={() => setAway((s) => Math.max(0, s - 1))}
                />
              </div>

              {state.error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2"
                >
                  {state.error}
                </motion.p>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <SubmitButton hasCurrent={!!current} />
              </DialogFooter>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function TeamScore({
  team,
  flag,
  score,
  onIncrement,
  onDecrement,
}: {
  team: string;
  flag: string;
  score: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-col items-center gap-1">
        <span className="text-3xl leading-none">{flag}</span>
        <p className="text-sm font-medium text-center truncate w-full max-w-[140px]">
          {team}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onDecrement}
          disabled={score <= 0}
        >
          <Minus />
        </Button>
        <motion.div
          key={score}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="w-14 h-14 rounded-md bg-muted flex items-center justify-center text-3xl font-bold tabular-nums"
        >
          {score}
        </motion.div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onIncrement}
          disabled={score >= 20}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}

function SubmitButton({ hasCurrent }: { hasCurrent: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? "Guardando..."
        : hasCurrent
          ? "Actualizar predicción"
          : "Guardar predicción"}
    </Button>
  );
}
