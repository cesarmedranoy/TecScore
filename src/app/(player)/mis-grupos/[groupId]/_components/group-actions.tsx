/**
 * GroupActions — acciones del header del detalle de grupo.
 *
 *  - Compartir código de invitación (copy to clipboard + toast)
 *  - Cambiar visibilidad (owner): público ↔ privado
 *  - Abandonar grupo (no owner)
 *  - Eliminar grupo (owner)
 */

"use client";

import { useState, useTransition } from "react";
import { Copy, Check, LogOut, Trash2, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
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
import {
  changeVisibilityAction,
  deleteGroupAction,
  leaveGroupAction,
} from "../../actions";
import type { GroupVisibility } from "@/types";

interface GroupActionsProps {
  groupId: string;
  isOwner: boolean;
  joinCode: string;
  currentVisibility: GroupVisibility;
}

export function GroupActions({
  groupId,
  isOwner,
  joinCode,
  currentVisibility,
}: GroupActionsProps) {
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  function copyCode() {
    navigator.clipboard.writeText(joinCode);
    setCopied(true);
    toast.success("Código copiado", {
      description: "Pásaselo a tus amigos para que se unan",
    });
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleVisibility() {
    const next: GroupVisibility =
      currentVisibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    startTransition(async () => {
      const res = await changeVisibilityAction(groupId, next);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.success ?? "Visibilidad actualizada");
      }
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" onClick={copyCode} className="font-mono">
        {copied ? <Check className="text-success" /> : <Copy />}
        {copied ? "¡Copiado!" : joinCode}
      </Button>

      {isOwner && (
        <Button
          variant="outline"
          size="icon"
          onClick={toggleVisibility}
          title={
            currentVisibility === "PUBLIC"
              ? "Cambiar a privado"
              : "Cambiar a público"
          }
        >
          {currentVisibility === "PUBLIC" ? <Globe /> : <Lock />}
        </Button>
      )}

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
            toast.success("Grupo eliminado");
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
          description="Pierdes tu posición en este ranking. Puedes volver con el código si es público."
          confirmLabel="Salir"
          action={async () => {
            await leaveGroupAction(groupId);
            toast.success("Saliste del grupo");
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
