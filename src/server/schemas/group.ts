/**
 * Schemas Zod para inputs de la API de grupos.
 *
 * Todo lo que llega del cliente pasa por uno de estos antes de llegar
 * a los services. Esto nos da seguridad de tipos + mensajes de error
 * útiles para la UI.
 */

import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(40, "Máximo 40 caracteres"),
  description: z.string().trim().max(200, "Máximo 200 caracteres").optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
  maxMembers: z
    .number()
    .int()
    .min(2, "Mínimo 2 miembros")
    .max(200, "Máximo 200 miembros")
    .optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const joinGroupSchema = z.object({
  code: z
    .string()
    .trim()
    .min(8, "El código tiene 8 caracteres")
    .max(10, "Código demasiado largo"),
});

export type JoinGroupInput = z.infer<typeof joinGroupSchema>;
