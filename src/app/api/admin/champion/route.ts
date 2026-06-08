/**
 * API routes para jugador — predicción del campeón.
 *
 * Guarda en: src/app/api/champion/route.ts
 *
 * GET  /api/champion → obtiene la predicción actual del usuario
 * POST /api/champion → guarda la predicción del usuario
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { specialEventService } from "@/server/services/special-event-service";
import { submitChampionPickSchema } from "@/server/schemas/special-event";
import { userRepository } from "@/server/repositories/user-repository";
import {
  EventNotActiveError,
  EventAlreadyAnsweredError,
  EventNotFoundError,
} from "@/server/services/special-event-service";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [user, activeEvent] = await Promise.all([
    userRepository.getById(session.user.id!),
    specialEventService.getActiveChampionEvent(),
  ]);

  return NextResponse.json({
    predictedChampion: user?.predictedChampionId ?? null,
    activeEvent: activeEvent ?? null,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = submitChampionPickSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await specialEventService.submitChampionPick(parsed.data, session.user.id!);
    return NextResponse.json({ ok: true, champion: parsed.data.answer });
  } catch (err) {
    if (err instanceof EventNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof EventNotActiveError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof EventAlreadyAnsweredError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}