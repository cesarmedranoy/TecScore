/**
 * /buscar — buscador de jugadores estilo Discord (nombre + tag).
 * Implementado en Fase 5.5.
 */

import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function BuscarPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buscar jugadores</h1>
        <p className="text-muted-foreground mt-1">
          Encontralos por nombre y tag (ejemplo: <code>Cesar#a4f9</code>).
        </p>
      </div>
      <Card>
        <CardContent className="pt-6 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cesar#a4f9"
              className="pl-10"
              disabled
            />
          </div>
          <p className="text-xs text-muted-foreground text-center pt-2">
            Buscador en construcción — disponible muy pronto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
