/**
 * Scoring service — orquesta el cálculo de puntos para un partido.
 *
 * Flujo:
 *  1. Verifica que el partido esté FINISHED con resultado.
 *  2. Marca el partido como scored (idempotente — si ya estaba, abortamos).
 *  3. Para cada predicción del partido:
 *     a. Evalúa reglas 1-3 + 5 → ScoringOutcome base.
 *     b. Lee el estado de racha del usuario.
 *     c. Aplica regla 4 (racha) si corresponde.
 *     d. Guarda PointEntry idempotentemente.
 *     e. Suma puntos al user.totalPoints.
 *     f. Actualiza currentStreak y maxStreak del usuario.
 *  4. Devuelve resumen.
 *
 * Idempotencia en dos capas:
 *  - matchRepository.markAsScored (ConditionExpression scored=false)
 *  - pointsRepository.award (ConditionExpression item no existe)
 *
 * Si dos workers concurrentes intentan scorear el mismo partido, solo uno
 * gana el lock de markAsScored — el otro recibe MatchAlreadyScoredError
 * y aborta sin tocar nada.
 */

import {
  matchRepository,
  MatchAlreadyScoredError,
  predictionRepository,
  userRepository,
  pointsRepository,
  PointsAlreadyAwardedError,
} from "@/server/repositories";
import {
  evaluatePrediction,
  nextStreakState,
  applyStreakBonus,
} from "@/lib/scoring/rules";
import { now } from "@/lib/utils";
import type { Match } from "@/types";

export interface ScoringSummary {
  matchId: string;
  predictionsScored: number;
  totalPointsAwarded: number;
  bonusesFired: number;
  errors: Array<{ userId: string; error: string }>;
}

export class MatchNotReadyForScoringError extends Error {
  constructor(matchId: string, status: Match["status"]) {
    super(
      `Match ${matchId} no está listo para scoring (status=${status})`,
    );
    this.name = "MatchNotReadyForScoringError";
  }
}

export const scoringService = {
  /**
   * Calcula y distribuye puntos para todas las predicciones de un partido.
   *
   * @throws MatchNotReadyForScoringError si el partido no está FINISHED.
   * @throws MatchAlreadyScoredError si otro worker ya scoreó.
   */
  async scoreMatch(matchId: string): Promise<ScoringSummary> {
    const match = await matchRepository.getById(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} no existe`);
    }
    if (
      match.status !== "FINISHED" ||
      match.homeScore === undefined ||
      match.awayScore === undefined
    ) {
      throw new MatchNotReadyForScoringError(matchId, match.status);
    }

    // Lock idempotente. Si lanza MatchAlreadyScoredError, lo dejamos
    // propagar — el caller decide si es error o ok.
    await matchRepository.markAsScored(matchId);

    const predictions = await predictionRepository.listByMatch(matchId);

    const summary: ScoringSummary = {
      matchId,
      predictionsScored: 0,
      totalPointsAwarded: 0,
      bonusesFired: 0,
      errors: [],
    };

    for (const prediction of predictions) {
      try {
        const baseOutcome = evaluatePrediction(prediction, match);

        // Leer estado de racha actual del usuario
        const user = await userRepository.getById(prediction.userId);
        if (!user) {
          summary.errors.push({
            userId: prediction.userId,
            error: "Usuario no encontrado al scorear",
          });
          continue;
        }

        const streakUpdate = nextStreakState(
          { currentStreak: user.currentStreak, maxStreak: user.maxStreak },
          baseOutcome.countsAsHit,
        );

        const finalOutcome = applyStreakBonus(
          baseOutcome,
          streakUpdate.bonusFired,
        );

        // Persistir el PointEntry idempotente
        await pointsRepository.award({
          userId: prediction.userId,
          matchId,
          amount: finalOutcome.points,
          reasons: finalOutcome.reasons,
          awardedAt: now(),
        });

        // Actualizar puntos totales y racha del usuario
        await userRepository.addPoints(prediction.userId, finalOutcome.points);
        await userRepository.setStreak(
          prediction.userId,
          streakUpdate.newState.currentStreak,
          streakUpdate.newState.maxStreak,
        );

        summary.predictionsScored += 1;
        summary.totalPointsAwarded += finalOutcome.points;
        if (streakUpdate.bonusFired) summary.bonusesFired += 1;
      } catch (err) {
        if (err instanceof PointsAlreadyAwardedError) {
          // Reintento idempotente — los puntos ya estaban dados, OK.
          continue;
        }
        summary.errors.push({
          userId: prediction.userId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return summary;
  },
};

export { MatchAlreadyScoredError };
