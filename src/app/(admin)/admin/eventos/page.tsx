/**
 * /admin/eventos — gestión de eventos especiales (ej: predicción del campeón).
 *
 * El admin puede:
 *  - Ver todos los eventos (DRAFT, ACTIVE, CLOSED, RESOLVED)
 *  - Crear un nuevo evento
 *  - Activar / cerrar un evento
 *  - Resolver un evento ingresando la respuesta correcta
 */

import { specialEventRepository } from "@/server/repositories/special-event-repository";
import { AdminEventsList } from "./AdminEventsList";

export default async function EventosPage() {
  const [draft, active, closed, resolved] = await Promise.all([
    specialEventRepository.listByStatus("DRAFT"),
    specialEventRepository.listByStatus("ACTIVE"),
    specialEventRepository.listByStatus("CLOSED"),
    specialEventRepository.listByStatus("RESOLVED"),
  ]);

  const events = [...active, ...draft, ...closed, ...resolved];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Eventos especiales</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Crea y gestiona eventos de predicción como el campeón del Mundial.
        </p>
      </div>
      <AdminEventsList initialEvents={events} />
    </div>
  );
}