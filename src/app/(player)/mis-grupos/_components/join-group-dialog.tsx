/**
 * Dialog para unirse a un grupo con código.
 *
 * Si el usuario tiene una solicitud pendiente (a un grupo privado), el
 * botón de enviar otro código queda deshabilitado hasta que cancele o
 * el owner responda.
 */

"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Clock, X } from "lucide-react";
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
import {
  joinGroupAction,
  cancelMyRequestAction,
  type ActionState,
} from "../actions";

const initialState: ActionState = {};

interface PendingRequestInfo {
  groupId: string;
  groupName: string;
  hoursLeft: number;
}

interface JoinGroupDialogProps {
  pendingRequest?: PendingRequestInfo;
}

export function JoinGroupDialog({ pendingRequest }: JoinGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(joinGroupAction, initialState);
  const [, startTransition] = useTransition();

  // Toasts cuando la action devuelve algo
  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  function cancelPending() {
    if (!pendingRequest) return;
    startTransition(async () => {
      const res = await cancelMyRequestAction(pendingRequest.groupId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Solicitud cancelada. Ya puedes enviar otro código.");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <KeyRound />
          {pendingRequest ? "Solicitud pendiente" : "Unirme con código"}
          {pendingRequest && (
            <span className="ml-1 size-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </Button>
      </DialogTrigger>

      <DialogContent>
        {pendingRequest ? (
          <>
            <DialogHeader>
              <DialogTitle>Solicitud en curso</DialogTitle>
              <DialogDescription>
                Tienes una solicitud pendiente. Espera la respuesta del owner
                o cancélala para enviar otro código.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-4 flex items-start gap-3">
              <Clock className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm text-amber-900 dark:text-amber-200">
                  Esperando respuesta de <strong>{pendingRequest.groupName}</strong>
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Te quedan {pendingRequest.hoursLeft} horas antes de que
                  expire la solicitud.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Esperar
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={cancelPending}
              >
                <X />
                Cancelar solicitud
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Unirme a un grupo</DialogTitle>
              <DialogDescription>
                Pega el código de invitación que te pasaron (formato ABCD-1234).
                Si el grupo es privado, se enviará una solicitud al owner.
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
          </>
        )}
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
