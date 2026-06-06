/**
 * POST /api/admin/matches — crear un partido nuevo.
 * Solo accesible por ADMIN.
 */

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { createMatchSchema } from "@/server/schemas/admin-match";
import { matchRepository } from "@/server/repositories";
import { newId, now } from "@/lib/utils";
import type { Match } from "@/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = createMatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Input inválido", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const match: Match = {
    matchId: newId(),
    stage: parsed.data.stage,
    homeTeam: parsed.data.homeTeam,
    awayTeam: parsed.data.awayTeam,
    kickoffAt: new Date(parsed.data.kickoffAt).toISOString(),
    status: "SCHEDULED",
    scored: false,
    updatedAt: now(),
  };
  await matchRepository.create(match);
  return NextResponse.json(match, { status: 201 });
}
