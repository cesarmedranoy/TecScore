/**
 * GroupActions — acciones del header del detalle de grupo.
 *
 *  - Compartir código de invitación (copy to clipboard)
 *  - Abandonar grupo (no owner)
 *  - Eliminar grupo (owner)
 */

"use client";

import { useState, useTransition } from "react";
import { Copy, Check, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteGroupAction, leaveGroupAction } from "../../actions";

interface GroupActionsProps {
  groupId: string;
  isOwner: boolean;
  joinCode: string;
}

export function GroupActions({ groupId, isOwner, joinCode }: GroupActionsProps) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={copyCode} className="font-mono">
        {copied ? <Check className="text-success" /> : <Copy />}
        {copied ? "¡Copiado!" : joinCode}
      </Button>

      {isOwner ? (
        <DangerDialog
          trigger={
            <Button variant="danger" size="icon" title="Eliminar grupo">
              <Trash2 />
            </Button>
          }
          title="¿Eliminar este grupo?"
          description="Se borra para todos los miembros. Esta acción no se puede deshacer."
          confirmLabel="Eliminar grupo"
          action={async () => {
            await deleteGroupAction(groupId);
          }}
        />
      ) : (
        <DangerDialog
          trigger={
            <Button variant="outline" size="icon" title="Salir del grupo">
              <LogOut />
            </Button>
          }
          title="¿Salir del grupo?"
          description="Vas a perder tu posición en este ranking. Podés volver con el código si es público."
          confirmLabel="Salir"
          action={async () => {
            await leaveGroupAction(groupId);
          }}
        />
      )}
    </div>
  );
}

function DangerDialog({
  trigger,
  title,
  description,
  confirmLabel,
  action,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  action: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await action();
                setOpen(false);
              });
            }}
          >
            {pending ? "..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
