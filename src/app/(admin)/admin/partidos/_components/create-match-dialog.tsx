"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
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

const initialState: AdminActionState = {};

export function CreateMatchDialog() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createMatchAction, initialState);

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
            El partido queda en estado SCHEDULED. Los jugadores podrán predecir
            hasta 10 min antes del kickoff.
          </DialogDescription>
        </DialogHeader>

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
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="awayTeam">Visitante</Label>
              <Input
                id="awayTeam"
                name="awayTeam"
                placeholder="Brasil"
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
