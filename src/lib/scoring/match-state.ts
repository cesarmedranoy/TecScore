/**
 * Máquina de estados de partidos.
 *
 * Centraliza qué transiciones son legales. Cualquier código que cambie
 * el status de un partido debe pasar por `assertTransition()` primero.
 *
 * Diagrama:
 *
 *   SCHEDULED ──→ LIVE ──→ FINISHED (terminal salvo correcciones admin)
 *       │         │
 *       │         ↓
 *       └──→ SUSPENDED ──→ LIVE | FINISHED | CANCELLED
 *                              ↑
 *                              │
 *   CANCELLED ──→ RESCHEDULED ──→ SCHEDULED  (reactiva predicciones)
 *
 * Fuente: enunciado del proyecto + comportamiento estándar de FIFA.
 */

import type { Match, MatchStatus } from "@/types";

export class InvalidMatchTransitionError extends Error {
  constructor(
    public readonly from: MatchStatus,
    public readonly to: MatchStatus,
  ) {
    super(`Transición ilegal: ${from} → ${to}`);
    this.name = "InvalidMatchTransitionError";
  }
}

/**
 * Tabla de transiciones permitidas. Modificarla acá es la única forma
 * "oficial" de cambiar la FSM — los tests detectan cualquier cambio.
 */
const ALLOWED: Record<MatchStatus, readonly MatchStatus[]> = {
  // SCHEDULED → FINISHED: admin marca resultado directo (la transición LIVE
  // es opcional en la realidad — al admin no le interesa marcar "en vivo").
  SCHEDULED: ["LIVE", "FINISHED", "SUSPENDED", "CANCELLED"],
  LIVE: ["FINISHED", "SUSPENDED"],
  SUSPENDED: ["LIVE", "FINISHED", "CANCELLED"],
  CANCELLED: ["RESCHEDULED"], // FIFA agrega nueva fecha
  RESCHEDULED: ["SCHEDULED"], // sistema reactiva predicciones
  FINISHED: [], // terminal (correcciones van por flujo admin separado)
};

export function canTransition(
  from: MatchStatus,
  to: MatchStatus,
): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

/** Lanza error si la transición no es legal. Útil en services. */
export function assertTransition(
  from: MatchStatus,
  to: MatchStatus,
): void {
  if (!canTransition(from, to)) {
    throw new InvalidMatchTransitionError(from, to);
  }
}

export function isTerminal(status: MatchStatus): boolean {
  return ALLOWED[status].length === 0;
}

// ============================================================================
// Reglas temporales (cierre de predicciones, ventana anticipada)
// ============================================================================

/** Minutos antes del kickoff donde se cierra la posibilidad de predecir. */
export const PREDICTION_CUTOFF_MINUTES = 10;

/** Horas antes del kickoff para que cuente como "predicción anticipada". */
export const EARLY_PREDICTION_HOURS = 24;

/**
 * Calcula cuántas horas faltan para el kickoff (puede ser negativo si ya pasó).
 * `atTime` es inyectable para que los tests sean deterministas.
 */
export function hoursBeforeKickoff(
  match: Pick<Match, "kickoffAt">,
  atTime: Date = new Date(),
): number {
  const kickoff = new Date(match.kickoffAt).getTime();
  return (kickoff - atTime.getTime()) / (1000 * 60 * 60);
}

/**
 * ¿Se acepta una predicción/cambio de predicción en este momento?
 *
 * Reglas:
 *  - Solo si el partido está SCHEDULED (no SUSPENDED, no CANCELLED, etc).
 *  - Solo si faltan más de PREDICTION_CUTOFF_MINUTES para el kickoff.
 */
export function acceptsPredictions(
  match: Pick<Match, "status" | "kickoffAt">,
  atTime: Date = new Date(),
): boolean {
  if (match.status !== "SCHEDULED") return false;
  const minutesLeft = hoursBeforeKickoff(match, atTime) * 60;
  return minutesLeft > PREDICTION_CUTOFF_MINUTES;
}

/**
 * ¿Esta predicción califica para el +1pt de "predicción anticipada"?
 * Se evalúa al MOMENTO DE SUBMIT (no al momento de scoring), por eso
 * pedimos `submittedAt` explícito en vez de leer `now()`.
 */
export function qualifiesAsEarly(
  match: Pick<Match, "kickoffAt">,
  submittedAt: Date,
): boolean {
  return hoursBeforeKickoff(match, submittedAt) > EARLY_PREDICTION_HOURS;
}
