/**
 * Validación de input para "marcar resultado de partido".
 *
 * Centralizamos todos los schemas Zod en src/server/schemas/ así un cambio
 * de validación nunca se pierde en endpoints distintos.
 */

import { z } from "zod";

export const matchResultSchema = z.object({
  homeScore: z
    .number()
    .int("El marcador debe ser entero")
    .min(0, "No puede ser negativo")
    .max(50, "Marcador inverosímil (>50)"),
  awayScore: z
    .number()
    .int("El marcador debe ser entero")
    .min(0, "No puede ser negativo")
    .max(50, "Marcador inverosímil (>50)"),
});

export type MatchResultInput = z.infer<typeof matchResultSchema>;
