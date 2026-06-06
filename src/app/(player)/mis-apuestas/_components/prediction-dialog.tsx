/**
 * PredictionDialog — modal para predecir/editar el marcador de un partido.
 */

"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Minus, Plus } from "lucide-react";
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

  // Cerrar el dialog cuando llegue success
  useEffect(() => {
    if (state.success) {
      const t = setTimeout(() => onOpenChange(false), 1000);
      return () => clearTimeout(t);
    }
  }, [state.success, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Predecir marcador</DialogTitle>
          <DialogDescription>
            {match.homeTeam} vs {match.awayTeam} —{" "}
            <span className="text-xs">
              Recordá: predicciones &gt;24h antes del kickoff suman +1 pt extra.
            </span>
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-6">
          <input type="hidden" name="matchId" value={match.matchId} />
          <input type="hidden" name="homeScore" value={home} />
          <input type="hidden" name="awayScore" value={away} />

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <TeamScore
              team={match.homeTeam}
              score={home}
              onIncrement={() => setHome((s) => Math.min(20, s + 1))}
              onDecrement={() => setHome((s) => Math.max(0, s - 1))}
            />
            <span className="text-muted-foreground text-2xl font-bold">:</span>
            <TeamScore
              team={match.awayTeam}
              score={away}
              onIncrement={() => setAway((s) => Math.min(20, s + 1))}
              onDecrement={() => setAway((s) => Math.max(0, s - 1))}
            />
          </div>

          {state.error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
              {state.error}
            </p>
          )}
          {state.success && (
            <p className="text-sm text-success bg-success/10 border border-success/30 rounded-md px-3 py-2">
              {state.success}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TeamScore({
  team,
  score,
  onIncrement,
  onDecrement,
}: {
  team: string;
  score: number;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium text-center truncate w-full">{team}</p>
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
        <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center text-3xl font-bold tabular-nums">
          {score}
        </div>
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Guardar predicción"}
    </Button>
  );
}
