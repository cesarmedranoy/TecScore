/**
 * Schemas Zod para eventos especiales.
 *
 * Guarda en: src/server/schemas/special-event.ts
 */

import { z } from "zod";

export const createSpecialEventSchema = z.object({
  type: z.enum(["CHAMPION_PICK", "YES_NO", "TOP_SCORER"]),
  title: z.string().trim().min(4, "Mínimo 4 chars").max(100, "Máximo 100 chars"),
  description: z.string().trim().max(300).optional(),
  points: z.number().int().min(1).max(1000),
  opensAt: z.string().refine((s) => !isNaN(new Date(s).getTime()), {
    message: "Fecha de apertura inválida",
  }),
  closesAt: z.string().refine((s) => !isNaN(new Date(s).getTime()), {
    message: "Fecha de cierre inválida",
  }),
}).refine((d) => new Date(d.closesAt) > new Date(d.opensAt), {
  message: "closesAt debe ser posterior a opensAt",
  path: ["closesAt"],
});

export const resolveSpecialEventSchema = z.object({
  correctAnswer: z.string().trim().min(1, "La respuesta correcta es requerida"),
});

export const submitChampionPickSchema = z.object({
  eventId: z.string().min(1, "eventId requerido"),
  answer: z.string().trim().min(1, "Debes elegir un país"),
});

export type CreateSpecialEventInput = z.infer<typeof createSpecialEventSchema>;
export type ResolveSpecialEventInput = z.infer<typeof resolveSpecialEventSchema>;
export type SubmitChampionPickInput = z.infer<typeof submitChampionPickSchema>;