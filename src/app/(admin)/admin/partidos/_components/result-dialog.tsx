"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { setMatchResultAction, type AdminActionState } from "../actions";
import type { Match } from "@/types";

const initialState: AdminActionState = {};

interface ResultDialogProps {
  match: Match;
}

export function ResultDialog({ match }: ResultDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(setMatchResultAction, initialState);
  const [home, setHome] = useState(match.homeScore ?? 0);
  const [away, setAway] = useState(match.awayScore ?? 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="accent" size="sm">
          Marcar resultado
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Marcar resultado final</DialogTitle>
          <DialogDescription>
            {match.homeTeam} vs {match.awayTeam}
            <br />
            <span className="text-xs text-danger">
              ⚠ Esto dispara el cálculo de puntos para todos los predictores.
              Es idempotente — si lo marcás 2 veces, los puntos no se duplican.
            </span>
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-6">
          <input type="hidden" name="matchId" value={match.matchId} />
          <input type="hidden" name="homeScore" value={home} />
          <input type="hidden" name="awayScore" value={away} />

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <ScoreInput
              team={match.homeTeam}
              score={home}
              onUp={() => setHome((s) => Math.min(50, s + 1))}
              onDown={() => setHome((s) => Math.max(0, s - 1))}
            />
            <span className="text-muted-foreground text-2xl font-bold">:</span>
            <ScoreInput
              team={match.awayTeam}
              score={away}
              onUp={() => setAway((s) => Math.min(50, s + 1))}
              onDown={() => setAway((s) => Math.max(0, s - 1))}
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
              onClick={() => setOpen(false)}
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

function ScoreInput({
  team,
  score,
  onUp,
  onDown,
}: {
  team: string;
  score: number;
  onUp: () => void;
  onDown: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-medium text-center truncate w-full">{team}</p>
      <div className="flex items-center gap-1">
        <Button type="button" variant="outline" size="icon" onClick={onDown}>
          <Minus />
        </Button>
        <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center text-3xl font-bold tabular-nums">
          {score}
        </div>
        <Button type="button" variant="outline" size="icon" onClick={onUp}>
          <Plus />
        </Button>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" disabled={pending}>
      {pending ? "Procesando scoring..." : "Confirmar y repartir puntos"}
    </Button>
  );
}
