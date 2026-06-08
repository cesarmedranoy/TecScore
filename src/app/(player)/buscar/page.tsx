/**
 * /buscar — buscador real de jugadores.
 * Permite enviar solicitud de amistad directamente desde aquí.
 */

import { Card, CardContent } from "@/components/ui/card";
import { SearchPlayers } from "./_components/search-players";

export default function BuscarPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buscar jugadores</h1>
        <p className="text-muted-foreground mt-1">
          Encuéntralos por nombre o tag (ejemplo: <code>Cesar#a4f9</code>).
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <SearchPlayers />
        </CardContent>
      </Card>
    </div>
  );
}
