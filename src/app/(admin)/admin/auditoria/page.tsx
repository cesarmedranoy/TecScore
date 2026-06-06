/**
 * /admin/auditoria — log de eventos de la plataforma.
 * Construir wiring completo en Fase 5.6 / 7 (cuando agreguemos audit en services).
 */

import { ScrollText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminAuditoriaPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Auditoría</h1>
        <p className="text-muted-foreground mt-1">
          Quién hizo qué, cuándo. Trazabilidad completa.
        </p>
      </div>
      <Card>
        <CardContent className="pt-16 pb-16 flex flex-col items-center text-center gap-3">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <ScrollText className="size-8" />
          </div>
          <h3 className="text-lg font-semibold">Log vacío</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Los eventos aparecerán acá a medida que se ejecuten acciones admin.
            La instrumentación se completa en una iteración posterior.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
