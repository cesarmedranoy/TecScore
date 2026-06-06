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

export const predictionService = {
  async submit(params: {
    userId: string;
    matchId: string;
    homeScore: number;
    awayScore: number;
  }): Promise<Prediction> {
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
