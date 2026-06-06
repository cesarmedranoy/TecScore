/**
 * /amigos — sistema de amistades.
 * Construido en Fase 5.5 (después de buscador + perfil).
 */

import { UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AmigosPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis amigos</h1>
        <p className="text-muted-foreground mt-1">
          Conectá con otros jugadores para competir en grupos.
        </p>
      </div>
      <Card>
        <CardContent className="pt-16 pb-16 flex flex-col items-center text-center gap-3">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <UserPlus className="size-8" />
          </div>
          <h3 className="text-lg font-semibold">Próximamente</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            El sistema de amistades llega en la próxima actualización junto
            con notificaciones en tiempo real.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
