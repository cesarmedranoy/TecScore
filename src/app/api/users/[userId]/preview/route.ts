/**
 * GET /api/users/:userId/preview — datos resumidos para el hover card.
 *
 * Devuelve: avatar info + puntos + racha + últimas 6 predicciones (con
 * resultados si ya se jugaron).
 *
 * Solo usuarios autenticados pueden consultar.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  userRepository,
  predictionRepository,
  matchRepository,
  pointsRepository,
} from "@/server/repositories";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { userId } = await params;

  const user = await userRepository.getById(userId);
  if (!user) {
    return NextResponse.json({ error: "Usuario no existe" }, { status: 404 });
  }

  // Últimas 6 predicciones del usuario
  const all = await predictionRepository.listByUser(userId);
  const recent = all
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() -
        new Date(a.submittedAt).getTime(),
    )
    .slice(0, 6);

  // Enriquecemos con info del partido y puntos
  const points = await pointsRepository.listByUser(userId);
  const pointsByMatch = new Map(points.map((p) => [p.matchId, p.amount]));

  const enriched = await Promise.all(
    recent.map(async (p) => {
      const match = await matchRepository.getById(p.matchId);
      return {
        matchId: p.matchId,
        homeTeam: match?.homeTeam ?? "?",
        awayTeam: match?.awayTeam ?? "?",
        homeScore: p.homeScore,
        awayScore: p.awayScore,
        actualHome: match?.homeScore,
        actualAway: match?.awayScore,
        status: match?.status ?? "SCHEDULED",
        pointsEarned: pointsByMatch.get(p.matchId) ?? 0,
        kickoffAt: match?.kickoffAt ?? "",
      };
    }),
  );

  return NextResponse.json({
    user: {
      userId: user.userId,
      displayName: user.displayName,
      tag: user.tag,
      avatarUrl: user.avatarUrl,
      avatarPreset: user.avatarPreset ?? "google",
      customAvatarDataUrl: user.customAvatarDataUrl,
      totalPoints: user.totalPoints,
      currentStreak: user.currentStreak,
      maxStreak: user.maxStreak,
      createdAt: user.createdAt,
    },
    recentPredictions: enriched,
  });
}
