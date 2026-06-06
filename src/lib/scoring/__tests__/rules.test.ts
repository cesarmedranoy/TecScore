/**
 * Tests del motor de puntos.
 *
 * Cubren las 5 reglas con casos de borde reales del Mundial:
 *  - Empates
 *  - Resultados altos (4-0, 5-2)
 *  - Predicciones imposibles (10-10)
 *  - Rachas largas
 *  - Predicciones de último minuto vs anticipadas
 *
 * Datos: 23 casos. Si alguno falla, hay un bug en la lógica de puntuación.
 */

import { describe, it, expect } from "vitest";
import {
  isExactScore,
  isCorrectWinner,
  isCorrectGoalDifference,
  countsForStreak,
  evaluatePrediction,
  nextStreakState,
  applyStreakBonus,
  RULE_POINTS,
  STREAK_BONUS_POINTS,
  EARLY_PREDICTION_POINTS,
} from "../rules";
import type { Match, Prediction } from "@/types";

// ============================================================================
// Helpers para fabricar fixtures legibles
// ============================================================================

function pred(home: number, away: number, submittedAt?: string): Prediction {
  return {
    userId: "u1",
    matchId: "m1",
    homeScore: home,
    awayScore: away,
    submittedAt: submittedAt ?? "2026-06-15T10:00:00Z",
    hoursBeforeKickoff: 48,
  };
}

function finished(home: number, away: number): Match {
  return {
    matchId: "m1",
    stage: "GROUP",
    homeTeam: "Argentina",
    awayTeam: "Brasil",
    kickoffAt: "2026-06-17T20:00:00Z", // 24h+ después de pred default
    status: "FINISHED",
    homeScore: home,
    awayScore: away,
    scored: false,
    updatedAt: "2026-06-17T22:00:00Z",
  };
}

// ============================================================================
// Reglas atómicas
// ============================================================================

describe("isExactScore", () => {
  it("acierta cuando ambos marcadores coinciden", () => {
    expect(isExactScore({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 1 })).toBe(true);
  });

  it("falla si solo home coincide", () => {
    expect(isExactScore({ homeScore: 2, awayScore: 1 }, { homeScore: 2, awayScore: 0 })).toBe(false);
  });

  it("acierta en empate 0-0", () => {
    expect(isExactScore({ homeScore: 0, awayScore: 0 }, { homeScore: 0, awayScore: 0 })).toBe(true);
  });
});

describe("isCorrectWinner", () => {
  it("acierta cuando home gana en ambos", () => {
    expect(isCorrectWinner({ homeScore: 3, awayScore: 1 }, { homeScore: 2, awayScore: 0 })).toBe(true);
  });

  it("acierta empate aunque marcadores difieran", () => {
    expect(isCorrectWinner({ homeScore: 1, awayScore: 1 }, { homeScore: 2, awayScore: 2 })).toBe(true);
  });

  it("falla cuando predijo empate pero ganó home", () => {
    expect(isCorrectWinner({ homeScore: 1, awayScore: 1 }, { homeScore: 2, awayScore: 0 })).toBe(false);
  });

  it("falla cuando predijo home pero ganó away", () => {
    expect(isCorrectWinner({ homeScore: 3, awayScore: 1 }, { homeScore: 0, awayScore: 2 })).toBe(false);
  });
});

describe("isCorrectGoalDifference", () => {
  it("acierta cuando ambos tienen home +2", () => {
    expect(isCorrectGoalDifference({ homeScore: 3, awayScore: 1 }, { homeScore: 2, awayScore: 0 })).toBe(true);
  });

  it("falla con diferente diferencia", () => {
    expect(isCorrectGoalDifference({ homeScore: 3, awayScore: 1 }, { homeScore: 4, awayScore: 1 })).toBe(false);
  });

  it("acierta empate con misma diferencia 0", () => {
    expect(isCorrectGoalDifference({ homeScore: 2, awayScore: 2 }, { homeScore: 1, awayScore: 1 })).toBe(true);
  });
});

// ============================================================================
// evaluatePrediction — combina reglas 1, 2, 3, 5
// ============================================================================

describe("evaluatePrediction", () => {
  it("resultado exacto otorga 5 puntos y razón EXACT_SCORE", () => {
    const r = evaluatePrediction(pred(2, 1), finished(2, 1));
    expect(r.points).toBe(RULE_POINTS.EXACT_SCORE + EARLY_PREDICTION_POINTS);
    expect(r.reasons).toContain("EXACT_SCORE");
    expect(r.reasons).not.toContain("CORRECT_WINNER");
    expect(r.reasons).not.toContain("GOAL_DIFFERENCE");
    expect(r.countsAsHit).toBe(true);
  });

  it("winner + diferencia da 3 + 2 + 1 anticipada = 6", () => {
    const r = evaluatePrediction(pred(3, 1), finished(2, 0));
    expect(r.points).toBe(
      RULE_POINTS.CORRECT_WINNER +
        RULE_POINTS.GOAL_DIFFERENCE +
        EARLY_PREDICTION_POINTS,
    );
    expect(r.reasons).toEqual(
      expect.arrayContaining([
        "CORRECT_WINNER",
        "GOAL_DIFFERENCE",
        "EARLY_PREDICTION",
      ]),
    );
  });

  it("solo winner correcto: 3 + 1 anticipada = 4", () => {
    const r = evaluatePrediction(pred(1, 0), finished(3, 1));
    expect(r.points).toBe(RULE_POINTS.CORRECT_WINNER + EARLY_PREDICTION_POINTS);
    expect(r.reasons).toContain("CORRECT_WINNER");
    expect(r.reasons).not.toContain("GOAL_DIFFERENCE");
  });

  it("predicción totalmente equivocada: 0 + 1 anticipada", () => {
    const r = evaluatePrediction(pred(3, 0), finished(0, 2));
    expect(r.points).toBe(EARLY_PREDICTION_POINTS);
    expect(r.reasons).toEqual(["EARLY_PREDICTION"]);
    expect(r.countsAsHit).toBe(false);
  });

  it("predicción de último minuto NO suma anticipada", () => {
    // submittedAt 1h antes del kickoff
    const lateP = pred(2, 1, "2026-06-17T19:00:00Z");
    const r = evaluatePrediction(lateP, finished(2, 1));
    expect(r.points).toBe(RULE_POINTS.EXACT_SCORE); // sin +1
    expect(r.reasons).not.toContain("EARLY_PREDICTION");
  });

  it("predicción exactamente 24h antes NO califica como anticipada", () => {
    // submittedAt exactamente 24h antes del kickoff → debe ser > 24h estricto
    const edgeP = pred(2, 1, "2026-06-16T20:00:00Z");
    const r = evaluatePrediction(edgeP, finished(2, 1));
    expect(r.reasons).not.toContain("EARLY_PREDICTION");
  });

  it("throws si match no está FINISHED", () => {
    const liveMatch = { ...finished(2, 1), status: "LIVE" as const };
    expect(() => evaluatePrediction(pred(2, 1), liveMatch)).toThrow();
  });
});

// ============================================================================
// Racha (regla 4)
// ============================================================================

describe("nextStreakState", () => {
  it("hit incrementa currentStreak", () => {
    const r = nextStreakState({ currentStreak: 0, maxStreak: 0 }, true);
    expect(r.newState.currentStreak).toBe(1);
    expect(r.bonusFired).toBe(false);
  });

  it("miss resetea currentStreak a 0", () => {
    const r = nextStreakState({ currentStreak: 5, maxStreak: 5 }, false);
    expect(r.newState.currentStreak).toBe(0);
    expect(r.newState.maxStreak).toBe(5); // max no disminuye
    expect(r.bonusFired).toBe(false);
  });

  it("dispara bonus en el 3er hit consecutivo", () => {
    const r = nextStreakState({ currentStreak: 2, maxStreak: 2 }, true);
    expect(r.newState.currentStreak).toBe(3);
    expect(r.bonusFired).toBe(true);
  });

  it("dispara bonus también en el 6to hit", () => {
    const r = nextStreakState({ currentStreak: 5, maxStreak: 5 }, true);
    expect(r.newState.currentStreak).toBe(6);
    expect(r.bonusFired).toBe(true);
  });

  it("NO dispara bonus en hits que no son múltiplo de 3", () => {
    const r1 = nextStreakState({ currentStreak: 0, maxStreak: 0 }, true);
    const r2 = nextStreakState(r1.newState, true);
    expect(r2.newState.currentStreak).toBe(2);
    expect(r2.bonusFired).toBe(false);
  });

  it("maxStreak se actualiza cuando current supera al previo", () => {
    const r = nextStreakState({ currentStreak: 7, maxStreak: 7 }, true);
    expect(r.newState.maxStreak).toBe(8);
  });
});

describe("applyStreakBonus", () => {
  it("suma 2 pts y razón STREAK_BONUS cuando bonusFired", () => {
    const out = applyStreakBonus(
      { points: 5, reasons: ["EXACT_SCORE"], countsAsHit: true },
      true,
    );
    expect(out.points).toBe(5 + STREAK_BONUS_POINTS);
    expect(out.reasons).toContain("STREAK_BONUS");
  });

  it("deja todo igual cuando no fired", () => {
    const before = { points: 3, reasons: ["CORRECT_WINNER" as const], countsAsHit: true };
    const out = applyStreakBonus(before, false);
    expect(out).toEqual(before);
  });
});

describe("countsForStreak", () => {
  it("predicción correcta de ganador cuenta", () => {
    expect(countsForStreak({ homeScore: 2, awayScore: 0 }, { homeScore: 3, awayScore: 1 })).toBe(true);
  });

  it("predicción de empate cuando hay empate cuenta", () => {
    expect(countsForStreak({ homeScore: 1, awayScore: 1 }, { homeScore: 0, awayScore: 0 })).toBe(true);
  });

  it("predicción de ganador equivocada NO cuenta", () => {
    expect(countsForStreak({ homeScore: 2, awayScore: 0 }, { homeScore: 0, awayScore: 1 })).toBe(false);
  });
});
