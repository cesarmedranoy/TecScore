/**
 * Prediction service — submitear una predicción con todas las validaciones.
 *
 * Reglas:
 *  - El partido debe estar SCHEDULED
 *  - Debe aceptar predicciones (>10 min antes del kickoff)
 *  - hoursBeforeKickoff se calcula y persiste para la regla "anticipada"
 */

import {
  matchRepository,
  predictionRepository,
  groupMemberRepository,
} from "@/server/repositories";
import {
  acceptsPredictions,
  hoursBeforeKickoff,
} from "@/lib/scoring/match-state";
import { now } from "@/lib/utils";
import type { Prediction } from "@/types";

export class MatchClosedForPredictionsError extends Error {
  constructor(matchId: string) {
    super(
      `El partido ${matchId} ya no acepta predicciones (cerrado o <10min al kickoff)`,
    );
    this.name = "MatchClosedForPredictionsError";
  }
}

export class MatchNotFoundError extends Error {
  constructor(matchId: string) {
    super(`Partido ${matchId} no existe`);
    this.name = "MatchNotFoundError";
  }
}

export class MustBeInGroupError extends Error {
  constructor() {
    super("Debes ser miembro de al menos 1 grupo para poder predecir");
    this.name = "MustBeInGroupError";
  }
}

export const predictionService = {
  async submit(params: {
    userId: string;
    matchId: string;
    homeScore: number;
    awayScore: number;
  }): Promise<Prediction> {
    // Regla de negocio crítica: sin grupo no se puede predecir.
    // No importa de qué grupo seas — basta con que estés en ≥1.
    const groupCount = await groupMemberRepository.countByUser(params.userId);
    if (groupCount === 0) {
      throw new MustBeInGroupError();
    }

    const match = await matchRepository.getById(params.matchId);
    if (!match) throw new MatchNotFoundError(params.matchId);

    const nowDate = new Date();
    if (!acceptsPredictions(match, nowDate)) {
      throw new MatchClosedForPredictionsError(params.matchId);
    }

    const prediction: Prediction = {
      userId: params.userId,
      matchId: params.matchId,
      homeScore: params.homeScore,
      awayScore: params.awayScore,
      submittedAt: now(),
      hoursBeforeKickoff: hoursBeforeKickoff(match, nowDate),
    };
    await predictionRepository.upsert(prediction);
    return prediction;
  },
};
