/**
 * Tests de la máquina de estados de partidos.
 * Validan las transiciones legales y las reglas temporales.
 */

import { describe, it, expect } from "vitest";
import {
  canTransition,
  assertTransition,
  isTerminal,
  acceptsPredictions,
  hoursBeforeKickoff,
  qualifiesAsEarly,
  InvalidMatchTransitionError,
  PREDICTION_CUTOFF_MINUTES,
} from "../match-state";
import type { Match } from "@/types";

function match(status: Match["status"], kickoffAt: string): Match {
  return {
    matchId: "m1",
    stage: "GROUP",
    homeTeam: "X",
    awayTeam: "Y",
    kickoffAt,
    status,
    scored: false,
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

describe("canTransition", () => {
  it("permite SCHEDULED → LIVE", () => {
    expect(canTransition("SCHEDULED", "LIVE")).toBe(true);
  });

  it("permite LIVE → FINISHED", () => {
    expect(canTransition("LIVE", "FINISHED")).toBe(true);
  });

  it("permite SCHEDULED → CANCELLED", () => {
    expect(canTransition("SCHEDULED", "CANCELLED")).toBe(true);
  });

  it("permite CANCELLED → RESCHEDULED (FIFA agrega fecha)", () => {
    expect(canTransition("CANCELLED", "RESCHEDULED")).toBe(true);
  });

  it("permite RESCHEDULED → SCHEDULED (predicciones se reactivan)", () => {
    expect(canTransition("RESCHEDULED", "SCHEDULED")).toBe(true);
  });

  it("rechaza FINISHED → cualquier cosa (es terminal)", () => {
    expect(canTransition("FINISHED", "LIVE")).toBe(false);
    expect(canTransition("FINISHED", "SCHEDULED")).toBe(false);
    expect(canTransition("FINISHED", "CANCELLED")).toBe(false);
  });

  it("rechaza SCHEDULED → FINISHED (debe pasar por LIVE)", () => {
    expect(canTransition("SCHEDULED", "FINISHED")).toBe(false);
  });
});

describe("assertTransition", () => {
  it("no lanza en transición legal", () => {
    expect(() => assertTransition("LIVE", "FINISHED")).not.toThrow();
  });

  it("lanza InvalidMatchTransitionError en transición ilegal", () => {
    expect(() => assertTransition("FINISHED", "LIVE")).toThrow(
      InvalidMatchTransitionError,
    );
  });
});

describe("isTerminal", () => {
  it("FINISHED es terminal", () => {
    expect(isTerminal("FINISHED")).toBe(true);
  });

  it("CANCELLED NO es terminal (puede reprogramarse)", () => {
    expect(isTerminal("CANCELLED")).toBe(false);
  });

  it("SCHEDULED no es terminal", () => {
    expect(isTerminal("SCHEDULED")).toBe(false);
  });
});

// ============================================================================
// Reglas temporales
// ============================================================================

describe("hoursBeforeKickoff", () => {
  it("retorna positivo si el kickoff es a futuro", () => {
    const m = match("SCHEDULED", "2026-06-17T20:00:00Z");
    const now = new Date("2026-06-17T18:00:00Z");
    expect(hoursBeforeKickoff(m, now)).toBe(2);
  });

  it("retorna negativo si el kickoff ya pasó", () => {
    const m = match("FINISHED", "2026-06-17T20:00:00Z");
    const now = new Date("2026-06-17T22:00:00Z");
    expect(hoursBeforeKickoff(m, now)).toBe(-2);
  });
});

describe("acceptsPredictions", () => {
  it("acepta si SCHEDULED y faltan más de 10 min", () => {
    const m = match("SCHEDULED", "2026-06-17T20:00:00Z");
    const now = new Date("2026-06-17T19:00:00Z"); // 60 min antes
    expect(acceptsPredictions(m, now)).toBe(true);
  });

  it("rechaza si faltan menos de 10 min", () => {
    const m = match("SCHEDULED", "2026-06-17T20:00:00Z");
    const now = new Date("2026-06-17T19:55:00Z"); // 5 min antes
    expect(acceptsPredictions(m, now)).toBe(false);
  });

  it("rechaza si el partido está LIVE", () => {
    const m = match("LIVE", "2026-06-17T20:00:00Z");
    const now = new Date("2026-06-17T15:00:00Z"); // 5h antes pero LIVE
    expect(acceptsPredictions(m, now)).toBe(false);
  });

  it("rechaza si el partido está CANCELLED", () => {
    const m = match("CANCELLED", "2026-06-17T20:00:00Z");
    const now = new Date("2026-06-17T15:00:00Z");
    expect(acceptsPredictions(m, now)).toBe(false);
  });

  it(`borde exacto en ${PREDICTION_CUTOFF_MINUTES} min: rechaza`, () => {
    const m = match("SCHEDULED", "2026-06-17T20:00:00Z");
    const now = new Date("2026-06-17T19:50:00Z"); // exactamente 10 min
    expect(acceptsPredictions(m, now)).toBe(false);
  });
});

describe("qualifiesAsEarly", () => {
  it("califica si fue >24h antes", () => {
    const m = match("SCHEDULED", "2026-06-17T20:00:00Z");
    const submittedAt = new Date("2026-06-15T20:00:00Z"); // 48h antes
    expect(qualifiesAsEarly(m, submittedAt)).toBe(true);
  });

  it("NO califica si fue exactamente 24h antes (strict >)", () => {
    const m = match("SCHEDULED", "2026-06-17T20:00:00Z");
    const submittedAt = new Date("2026-06-16T20:00:00Z");
    expect(qualifiesAsEarly(m, submittedAt)).toBe(false);
  });

  it("NO califica si fue 1h antes", () => {
    const m = match("SCHEDULED", "2026-06-17T20:00:00Z");
    const submittedAt = new Date("2026-06-17T19:00:00Z");
    expect(qualifiesAsEarly(m, submittedAt)).toBe(false);
  });
});
