/**
 * API routes para admin — gestión de eventos especiales.
 *
 * Guarda en: src/app/api/admin/events/route.ts
 *
 * GET  /api/admin/events         → lista todos los eventos (DRAFT + ACTIVE + CLOSED + RESOLVED)
 * POST /api/admin/events         → crea un evento nuevo
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { specialEventService } from "@/server/services/special-event-service";
import { specialEventRepository } from "@/server/repositories/special-event-repository";
import { createSpecialEventSchema } from "@/server/schemas/special-event";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  return session;
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const [draft, active, closed, resolved] = await Promise.all([
    specialEventRepository.listByStatus("DRAFT"),
    specialEventRepository.listByStatus("ACTIVE"),
    specialEventRepository.listByStatus("CLOSED"),
    specialEventRepository.listByStatus("RESOLVED"),
  ]);

  return NextResponse.json({
    events: [...draft, ...active, ...closed, ...resolved],
  });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  const parsed = createSpecialEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const event = await specialEventService.createEvent(
    parsed.data,
    session.user.id!,
  );
  return NextResponse.json({ event }, { status: 201 });
}