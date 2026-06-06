/**
 * Schemas para CRUD admin de partidos.
 */

import { z } from "zod";

const STAGES = [
  "GROUP",
  "ROUND_OF_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
] as const;

export const createMatchSchema = z.object({
  stage: z.enum(STAGES),
  homeTeam: z
    .string()
    .trim()
    .min(2, "Mínimo 2 chars")
    .max(40, "Máximo 40 chars"),
  awayTeam: z
    .string()
    .trim()
    .min(2, "Mínimo 2 chars")
    .max(40, "Máximo 40 chars"),
  kickoffAt: z.string().refine((s) => !isNaN(new Date(s).getTime()), {
    message: "Fecha inválida",
  }),
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
