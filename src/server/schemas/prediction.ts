/**
 * Schema de input para "submitear predicción".
 */

import { z } from "zod";

export const submitPredictionSchema = z.object({
  matchId: z.string().min(1, "matchId requerido"),
  homeScore: z
    .number()
    .int("Debe ser entero")
    .min(0, "No puede ser negativo")
    .max(20, "Marcador inverosímil"),
  awayScore: z
    .number()
    .int("Debe ser entero")
    .min(0, "No puede ser negativo")
    .max(20, "Marcador inverosímil"),
});

export type SubmitPredictionInput = z.infer<typeof submitPredictionSchema>;
