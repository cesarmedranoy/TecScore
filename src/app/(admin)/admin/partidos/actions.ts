/**
 * Server actions del admin de partidos — con auditoría.
 *
 * Guarda en: src/app/(admin)/admin/partidos/actions.ts
 */

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createMatchSchema } from "@/server/schemas/admin-match";
import { matchResultSchema } from "@/server/schemas/match-result";
import { matchRepository } from "@/server/repositories";
import { auditLogRepository } from "@/server/repositories/audit-log-repository";
import { assertTransition, InvalidMatchTransitionError } from "@/lib/scoring/match-state";
import {
  scoringService,
  MatchAlreadyScoredError,
} from "@/server/services/scoring-service";
import { newId, now } from "@/lib/utils";
import type { Match } from "@/types";

export interface AdminActionState {
  error?: string;
  success?: string;
}

export async function createMatchAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "No autorizado" };
  }

  const raw = {
    stage: String(formData.get("stage") ?? "GROUP"),
    homeTeam: String(formData.get("homeTeam") ?? "").trim(),
    awayTeam: String(formData.get("awayTeam") ?? "").trim(),
    kickoffAt: String(formData.get("kickoffAt") ?? ""),
  };
  const parsed = createMatchSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const first = Object.values(flat.fieldErrors)[0]?.[0];
    return { error: first ?? "Input inválido" };
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

  // ── Auditoría ──────────────────────────────────────────────────────────────
  await auditLogRepository.create({
    actorId: session.user.userId,
    action: "MATCH_CREATE",
    targetType: "MATCH",
    targetId: match.matchId,
    diff: {
      homeTeam: { from: null, to: match.homeTeam },
      awayTeam: { from: null, to: match.awayTeam },
      stage:    { from: null, to: match.stage },
      kickoffAt: { from: null, to: match.kickoffAt },
    },
  }).catch(() => {}); // silent — la auditoría no debe romper el flujo

  revalidatePath("/admin/partidos");
  revalidatePath("/admin");
  return { success: `Partido ${match.homeTeam} vs ${match.awayTeam} creado` };
}

export async function setMatchResultAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "No autorizado" };
  }

  const matchId = String(formData.get("matchId") ?? "");
  const homeScore = Number(formData.get("homeScore"));
  const awayScore = Number(formData.get("awayScore"));

  const parsed = matchResultSchema.safeParse({ homeScore, awayScore });
  if (!parsed.success) return { error: "Marcador inválido" };
  if (!matchId) return { error: "matchId requerido" };

  const match = await matchRepository.getById(matchId);
  if (!match) return { error: "El partido no existe" };

  try {
    assertTransition(match.status, "FINISHED");
  } catch (err) {
    if (err instanceof InvalidMatchTransitionError) {
      return { error: `No se puede pasar de ${match.status} a FINISHED` };
    }
    throw err;
  }

  await matchRepository.setResult(matchId, parsed.data.homeScore, parsed.data.awayScore);

  // ── Auditoría ──────────────────────────────────────────────────────────────
  await auditLogRepository.create({
    actorId: session.user.userId,
    action: "MATCH_RESULT_UPDATE",
    targetType: "MATCH",
    targetId: matchId,
    diff: {
      homeScore: { from: match.homeScore ?? null, to: parsed.data.homeScore },
      awayScore: { from: match.awayScore ?? null, to: parsed.data.awayScore },
      status:    { from: match.status, to: "FINISHED" },
    },
  }).catch(() => {});

  try {
    const summary = await scoringService.scoreMatch(matchId);
    revalidatePath("/admin/partidos");
    revalidatePath("/admin");
    return {
      success: `Resultado guardado. ${summary.predictionsScored} predicciones procesadas, ${summary.totalPointsAwarded} pts repartidos.`,
    };
  } catch (err) {
    if (err instanceof MatchAlreadyScoredError) {
      return { error: "Este partido ya fue scoreado" };
    }
    throw err;
  }
}

export async function updateMatchStatusAction(
  matchId: string,
  newStatus: Match["status"],
): Promise<AdminActionState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "No autorizado" };
  }
  const match = await matchRepository.getById(matchId);
  if (!match) return { error: "El partido no existe" };

  try {
    assertTransition(match.status, newStatus);
  } catch (err) {
    if (err instanceof InvalidMatchTransitionError) {
      return { error: `Transición inválida ${match.status} → ${newStatus}` };
    }
    throw err;
  }

  await matchRepository.updateStatus(matchId, newStatus);

  // ── Auditoría ──────────────────────────────────────────────────────────────
  await auditLogRepository.create({
    actorId: session.user.userId,
    action: "MATCH_STATUS_UPDATE",
    targetType: "MATCH",
    targetId: matchId,
    diff: {
      status: { from: match.status, to: newStatus },
    },
  }).catch(() => {});

  revalidatePath("/admin/partidos");
  return { success: `Estado actualizado a ${newStatus}` };
}