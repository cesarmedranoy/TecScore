/**
 * Motor de puntuación — implementa las 5 reglas del enunciado.
 *
 * TODAS las funciones de este archivo son PURAS:
 *  - Sin DB, sin red, sin Date.now()
 *  - Mismo input → mismo output siempre
 *  - 100% testeables sin mocks
 *
 * Esto es deliberado: el scoring es el cerebro del proyecto y debe ser
 * auditable. Cualquier bug acá afecta la justicia del concurso.
 *
 * Las reglas exactas (no improvisar):
 *  1. Resultado exacto         → 5 pts
 *  2. Ganador correcto         → 3 pts
 *  3. Diferencia de goles      → 2 pts
 *  4. Bonus por racha (3 hits) → +2 pts
 *  5. Predicción anticipada    → +1 pt
 *
 * Interpretación de exclusividad (resuelta como senior):
 *  - Si la predicción es EXACTA: 5 pts (no se suma winner + diff)
 *  - Si NO es exacta pero acierta el ganador: 3 + (diff correcta ? 2 : 0)
 *  - Si no acierta el ganador: 0 pts del bloque "resultado"
 *  - Máximo por partido: 5 (resultado) + 1 (anticipada) + 2 (racha) = 8 pts
 */

import type { PointReason, Prediction, Match } from "@/types";
import { qualifiesAsEarly } from "./match-state";

/** Cantidad de aciertos consecutivos requeridos para disparar el bonus. */
export const STREAK_BONUS_EVERY = 3;
export const STREAK_BONUS_POINTS = 2;
export const EARLY_PREDICTION_POINTS = 1;

export const RULE_POINTS = {
  EXACT_SCORE: 5,
  CORRECT_WINNER: 3,
  GOAL_DIFFERENCE: 2,
} as const;

interface MatchResult {
  homeScore: number;
  awayScore: number;
}

interface PredictedScore {
  homeScore: number;
  awayScore: number;
}

/** ¿La predicción acertó el marcador exacto? */
export function isExactScore(
  prediction: PredictedScore,
  result: MatchResult,
): boolean {
  return (
    prediction.homeScore === result.homeScore &&
    prediction.awayScore === result.awayScore
  );
}

/** ¿Acertó qué equipo gana (o el empate)? */
export function isCorrectWinner(
  prediction: PredictedScore,
  result: MatchResult,
): boolean {
  return (
    Math.sign(prediction.homeScore - prediction.awayScore) ===
    Math.sign(result.homeScore - result.awayScore)
  );
}

/** ¿Acertó la diferencia exacta de goles (mismo equipo ganador implícito)? */
export function isCorrectGoalDifference(
  prediction: PredictedScore,
  result: MatchResult,
): boolean {
  return (
    prediction.homeScore - prediction.awayScore ===
    result.homeScore - result.awayScore
  );
}

/** Aciertos de "ganador" cuentan para racha. Empate predicho + empate real → hit. */
export function countsForStreak(
  prediction: PredictedScore,
  result: MatchResult,
): boolean {
  return isCorrectWinner(prediction, result);
}

// ============================================================================
// Cálculo de puntos por predicción individual
// ============================================================================

export interface ScoringOutcome {
  points: number;
  reasons: PointReason[];
  countsAsHit: boolean; // para el cómputo de racha
}

/**
 * Calcula los puntos de una predicción dada el resultado del partido.
 *
 * Maneja las reglas 1, 2, 3 y 5 (NO la racha — esa requiere el estado
 * del usuario y se aplica en una segunda pasada por `applyStreakBonus`).
 */
export function evaluatePrediction(
  prediction: Prediction,
  match: Match,
): ScoringOutcome {
  if (
    match.homeScore === undefined ||
    match.awayScore === undefined ||
    match.status !== "FINISHED"
  ) {
    throw new Error(
      `evaluatePrediction requiere match FINISHED con resultado; recibí status=${match.status}`,
    );
  }

  const result = {
    homeScore: match.homeScore,
    awayScore: match.awayScore,
  };

  const reasons: PointReason[] = [];
  let points = 0;

  // Bloque "resultado" — exclusivo
  if (isExactScore(prediction, result)) {
    reasons.push("EXACT_SCORE");
    points += RULE_POINTS.EXACT_SCORE;
  } else if (isCorrectWinner(prediction, result)) {
    reasons.push("CORRECT_WINNER");
    points += RULE_POINTS.CORRECT_WINNER;
    if (isCorrectGoalDifference(prediction, result)) {
      reasons.push("GOAL_DIFFERENCE");
      points += RULE_POINTS.GOAL_DIFFERENCE;
    }
  }

  // Bloque "predicción anticipada" — independiente, aplica aunque pierda
  if (qualifiesAsEarly(match, new Date(prediction.submittedAt))) {
    reasons.push("EARLY_PREDICTION");
    points += EARLY_PREDICTION_POINTS;
  }

  const countsAsHit = countsForStreak(prediction, result);

  return { points, reasons, countsAsHit };
}

// ============================================================================
// Racha (regla 4)
// ============================================================================

export interface StreakState {
  currentStreak: number;
  maxStreak: number;
}

export interface StreakUpdate {
  newState: StreakState;
  bonusFired: boolean;
}

/**
 * Actualiza la racha del usuario tras una predicción.
 *
 * Reglas:
 *  - Si fue hit: streak += 1; si streak es múltiplo de 3 → bonus
 *  - Si fue miss: streak = 0
 *  - maxStreak nunca disminuye (es histórico)
 */
export function nextStreakState(
  state: StreakState,
  isHit: boolean,
): StreakUpdate {
  if (!isHit) {
    return {
      newState: { currentStreak: 0, maxStreak: state.maxStreak },
      bonusFired: false,
    };
  }
  const currentStreak = state.currentStreak + 1;
  const maxStreak = Math.max(state.maxStreak, currentStreak);
  const bonusFired = currentStreak % STREAK_BONUS_EVERY === 0;
  return {
    newState: { currentStreak, maxStreak },
    bonusFired,
  };
}

/**
 * Aplica el bonus de racha al ScoringOutcome si corresponde.
 * Función separada para que el orden de cálculo sea explícito en el caller.
 */
export function applyStreakBonus(
  outcome: ScoringOutcome,
  bonusFired: boolean,
): ScoringOutcome {
  if (!bonusFired) return outcome;
  return {
    points: outcome.points + STREAK_BONUS_POINTS,
    reasons: [...outcome.reasons, "STREAK_BONUS"],
    countsAsHit: outcome.countsAsHit,
  };
}
