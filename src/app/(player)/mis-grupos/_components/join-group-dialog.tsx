/**
 * Dialog para unirse a un grupo con código.
 */

"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound } from "lucide-react";
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
import { joinGroupAction, type ActionState } from "../actions";

const initialState: ActionState = {};

export function JoinGroupDialog() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(joinGroupAction, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <KeyRound />
          Unirme con código
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unirme a un grupo</DialogTitle>
          <DialogDescription>
            Pegá el código de invitación que te pasaron (formato ABCD-1234).
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              name="code"
              placeholder="ABCD-1234"
              autoComplete="off"
              autoCapitalize="characters"
              className="font-mono tracking-wider text-center text-lg uppercase"
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
      {pending ? "Verificando..." : "Unirme"}
    </Button>
  );
}
