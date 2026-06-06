/**
 * Dialog para crear un grupo nuevo.
 * Form con server action; useActionState para mostrar errores inline.
 */

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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createGroupAction, type ActionState } from "../actions";

const initialState: ActionState = {};

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(createGroupAction, initialState);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Crear grupo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear un grupo nuevo</DialogTitle>
          <DialogDescription>
            Cualquiera con el código de invitación podrá unirse (si es público)
            o pedir entrar (si es privado).
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              placeholder="Los del salón"
              required
              minLength={3}
              maxLength={40}
            />
            {state.details?.name && (
              <p className="text-xs text-danger">{state.details.name[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Para predecir el Mundial entre amigos"
              maxLength={200}
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <Label>Visibilidad</Label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 cursor-pointer rounded-md border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="PUBLIC"
                    defaultChecked
                  />
                  <span className="font-medium text-sm">Público</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Quien tenga el código entra directo
                </span>
              </label>
              <label className="flex flex-col gap-1 cursor-pointer rounded-md border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                <div className="flex items-center gap-2">
                  <input type="radio" name="visibility" value="PRIVATE" />
                  <span className="font-medium text-sm">Privado</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Las solicitudes esperan tu aprobación (12h)
                </span>
              </label>
            </div>
          </fieldset>

          {state.error && (
            <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
              {state.error}
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creando..." : "Crear grupo"}
    </Button>
  );
}
