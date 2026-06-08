/**
 * API routes para admin — acciones sobre un evento específico.
 *
 * Guarda en: src/app/api/admin/events/[eventId]/route.ts
 *
 * PATCH /api/admin/events/:id         → cambia status (DRAFT→ACTIVE→CLOSED)
 * POST  /api/admin/events/:id/resolve → resuelve el evento y otorga puntos
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { specialEventService } from "@/server/services/special-event-service";
import { resolveSpecialEventSchema } from "@/server/schemas/special-event";
import {
  EventNotFoundError,
  EventAlreadyResolvedError,
} from "@/server/services/special-event-service";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  return session;
}

type Params = { params: Promise<{ eventId: string }> };

// PATCH → cambiar status
export async function PATCH(req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { eventId } = await params;
  const body = await req.json();
  const { status } = body;

  if (!["DRAFT", "ACTIVE", "CLOSED"].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  try {
    await specialEventService.updateStatus(eventId, status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof EventNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}

// POST → resolver evento y otorgar puntos
export async function POST(req: Request, { params }: Params) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { eventId } = await params;
  const body = await req.json();
  const parsed = resolveSpecialEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await specialEventService.resolveChampionEvent(
      eventId,
      parsed.data.correctAnswer,
    );
    return NextResponse.json({
      ok: true,
      rewarded: result.rewarded,
      message: `${result.rewarded} jugadores recibieron puntos por acertar el campeón.`,
    });
  } catch (err) {
    if (err instanceof EventNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof EventAlreadyResolvedError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}