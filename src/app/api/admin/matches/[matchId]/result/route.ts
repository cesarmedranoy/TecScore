/**
 * POST /api/admin/matches/:matchId/result
 *
 * Marca el resultado de un partido y dispara el scoring de TODAS las
 * predicciones de ese partido.
 *
 * Body:
 *   { "homeScore": number, "awayScore": number }
 *
 * Requiere:
 *   - Sesión activa con role=ADMIN
 *   - Partido existente en estado SCHEDULED, LIVE o SUSPENDED
 *
 * Respuesta exitosa:
 *   200 OK { matchId, predictionsScored, totalPointsAwarded, bonusesFired, errors }
 *
 * Es idempotente: si admin envía el mismo POST dos veces, la segunda
 * vez devuelve 409 sin tocar los puntos.
 */

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { matchResultSchema } from "@/server/schemas/match-result";
import { matchRepository } from "@/server/repositories";
import { assertTransition } from "@/lib/scoring/match-state";
import {
  scoringService,
  MatchAlreadyScoredError,
  MatchNotReadyForScoringError,
} from "@/server/services/scoring-service";
import { InvalidMatchTransitionError } from "@/lib/scoring/match-state";

type Params = Promise<{ matchId: string }>;

export async function POST(
  req: NextRequest,
  { params }: { params: Params },
) {
  // 1. Auth
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // 2. Validar input
  const { matchId } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = matchResultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Input inválido", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { homeScore, awayScore } = parsed.data;

  // 3. Verificar que el partido exista y se pueda transicionar a FINISHED
  const match = await matchRepository.getById(matchId);
  if (!match) {
    return NextResponse.json(
      { error: `Match ${matchId} no existe` },
      { status: 404 },
    );
  }
  try {
    assertTransition(match.status, "FINISHED");
  } catch (err) {
    if (err instanceof InvalidMatchTransitionError) {
      return NextResponse.json(
        {
          error: `Transición inválida ${err.from} → ${err.to}`,
        },
        { status: 409 },
      );
    }
    throw err;
  }

  // 4. Persistir resultado (status pasa a FINISHED, scored=false)
  await matchRepository.setResult(matchId, homeScore, awayScore);

  // 5. Disparar scoring (idempotente)
  try {
    const summary = await scoringService.scoreMatch(matchId);
    return NextResponse.json(summary, { status: 200 });
  } catch (err) {
    if (err instanceof MatchAlreadyScoredError) {
      return NextResponse.json(
        { error: "Este partido ya fue scoreado previamente" },
        { status: 409 },
      );
    }
    if (err instanceof MatchNotReadyForScoringError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
