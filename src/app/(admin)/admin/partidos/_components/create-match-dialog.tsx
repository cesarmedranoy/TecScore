"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMatchAction, type AdminActionState } from "../actions";
import { getFlag } from "@/lib/teams/flags";

const initialState: AdminActionState = {};

export function CreateMatchDialog() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createMatchAction, initialState);
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");

  const homeFlag = homeTeam.trim() ? getFlag(homeTeam) : "🏳️";
  const awayFlag = awayTeam.trim() ? getFlag(awayTeam) : "🏳️";

  // Toast cuando hay success/error y reset del form
  useEffect(() => {
    if (state.success) {
      toast.success("⚽ Partido creado", {
        description: state.success,
      });
      setHomeTeam("");
      setAwayTeam("");
      setOpen(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Crear partido
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cargar nuevo partido</DialogTitle>
          <DialogDescription>
            El partido queda en estado <strong>SCHEDULED</strong>. Los jugadores
            podrán predecir hasta 10 min antes del kickoff.
          </DialogDescription>
        </DialogHeader>

        {/* Preview en vivo */}
        {(homeTeam || awayTeam) && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-center gap-4 text-center">
            <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
              <span className="text-4xl leading-none">{homeFlag}</span>
              <span className="text-sm font-semibold truncate w-full">
                {homeTeam || "Local"}
              </span>
            </div>
            <span className="text-muted-foreground text-lg font-bold">vs</span>
            <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
              <span className="text-4xl leading-none">{awayFlag}</span>
              <span className="text-sm font-semibold truncate w-full">
                {awayTeam || "Visitante"}
              </span>
            </div>
          </div>
        )}

        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stage">Etapa</Label>
            <select
              id="stage"
              name="stage"
              defaultValue="GROUP"
              className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm"
            >
              <option value="GROUP">Fase de grupos</option>
              <option value="ROUND_OF_16">Octavos de final</option>
              <option value="QUARTER_FINALS">Cuartos de final</option>
              <option value="SEMI_FINALS">Semifinales</option>
              <option value="THIRD_PLACE">Tercer puesto</option>
              <option value="FINAL">Final</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="homeTeam">Local</Label>
              <Input
                id="homeTeam"
                name="homeTeam"
                placeholder="Argentina"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="awayTeam">Visitante</Label>
              <Input
                id="awayTeam"
                name="awayTeam"
                placeholder="Brasil"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kickoffAt">Fecha y hora del kickoff</Label>
            <Input
              id="kickoffAt"
              name="kickoffAt"
              type="datetime-local"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cerrar
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creando..." : "Crear partido"}
    </Button>
  );
}
