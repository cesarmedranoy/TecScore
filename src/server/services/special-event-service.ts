/**
 * SpecialEventService — lógica de negocio de eventos especiales.
 *
 * Guarda en: src/server/services/special-event-service.ts
 *
 * Responsabilidades:
 *  - Crear y activar eventos (admin)
 *  - Guardar respuesta del usuario (champion pick → User.predictedChampionId)
 *  - Resolver el evento y otorgar puntos (se llama desde scoring cuando
 *    el admin marca resultado de la FINAL)
 */

import { ulid } from "ulid";
import { specialEventRepository } from "@/server/repositories/special-event-repository";
import { userRepository } from "@/server/repositories/user-repository";
import { pointsRepository } from "@/server/repositories/points-repository";
import { now } from "@/lib/utils";
import type {
  SpecialEvent,
  SpecialEventStatus,
  PointEntry,
} from "@/types";
import type {
  CreateSpecialEventInput,
  SubmitChampionPickInput,
} from "@/server/schemas/special-event";

// ─── Errores tipados ──────────────────────────────────────────────────────────

export class EventNotFoundError extends Error {
  constructor(id: string) { super(`Evento ${id} no encontrado`); }
}
export class EventNotActiveError extends Error {
  constructor() { super("El evento no está activo en este momento"); }
}
export class EventAlreadyAnsweredError extends Error {
  constructor() { super("Ya respondiste este evento"); }
}
export class EventAlreadyResolvedError extends Error {
  constructor() { super("Este evento ya fue resuelto"); }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const specialEventService = {
  // ── Admin: crear evento ───────────────────────────────────────────────────
  async createEvent(
    input: CreateSpecialEventInput,
    adminId: string,
  ): Promise<SpecialEvent> {
    const event: SpecialEvent = {
      eventId: ulid(),
      ...input,
      status: "DRAFT",
      createdBy: adminId,
      createdAt: now(),
      updatedAt: now(),
    };
    await specialEventRepository.create(event);
    return event;
  },

  // ── Admin: activar / cerrar evento ───────────────────────────────────────
  async updateStatus(
    eventId: string,
    status: SpecialEventStatus,
  ): Promise<void> {
    const event = await specialEventRepository.getById(eventId);
    if (!event) throw new EventNotFoundError(eventId);
    await specialEventRepository.updateStatus(eventId, status);
  },

  // ── Player: obtener evento activo de tipo CHAMPION_PICK ───────────────────
  async getActiveChampionEvent(): Promise<SpecialEvent | null> {
    const events = await specialEventRepository.listByStatus("ACTIVE");
    return events.find((e) => e.type === "CHAMPION_PICK") ?? null;
  },

  // ── Player: guardar predicción de campeón ────────────────────────────────
  // Guarda en User.predictedChampionId (campo ya existente en el modelo)
  async submitChampionPick(
    input: SubmitChampionPickInput,
    userId: string,
  ): Promise<void> {
    const event = await specialEventRepository.getById(input.eventId);
    if (!event) throw new EventNotFoundError(input.eventId);

    // Validar que el evento esté ACTIVE y dentro de la ventana de tiempo
    const isActive =
      event.status === "ACTIVE" &&
      new Date() >= new Date(event.opensAt) &&
      new Date() <= new Date(event.closesAt);

    if (!isActive) throw new EventNotActiveError();

    // Verificar que no haya respondido antes
    const user = await userRepository.getById(userId);
    if (!user) throw new Error("Usuario no encontrado");
    if (user.predictedChampionId) throw new EventAlreadyAnsweredError();

    // Guardar en el campo existente del User
    await userRepository.updateChampionPick(userId, input.answer);
  },

  // ── Sistema: resolver evento y otorgar puntos ─────────────────────────────
  // Llamado automáticamente desde scoring cuando el admin marca la FINAL
  async resolveChampionEvent(
    eventId: string,
    winnerCountry: string,
  ): Promise<{ rewarded: number }> {
    const event = await specialEventRepository.getById(eventId);
    if (!event) throw new EventNotFoundError(eventId);
    if (event.status === "RESOLVED") throw new EventAlreadyResolvedError();

    // 1. Marcar evento como resuelto con la respuesta correcta
    await specialEventRepository.resolve(eventId, winnerCountry);

    // 2. Buscar todos los usuarios que predijeron este país
    //    (scan es aceptable — solo se ejecuta UNA vez al final del torneo)
    const allUsers = await userRepository.listAll();
    const winners = allUsers.filter(
      (u) => u.predictedChampionId === winnerCountry,
    );

    // 3. Otorgar puntos a cada ganador
    let rewarded = 0;
    for (const user of winners) {
      const entry: PointEntry = {
        userId: user.userId,
        matchId: `event:${eventId}`,   // convención: event:<eventId> como matchId
        amount: event.points,
        reasons: ["CHAMPION_BONUS"],
        awardedAt: now(),
      };
      await pointsRepository.award(entry);
      await userRepository.addPoints(user.userId, event.points);
      rewarded++;
    }

    return { rewarded };
  },

  // ── Admin: listar todos los eventos ──────────────────────────────────────
  async listActive(): Promise<SpecialEvent[]> {
    return specialEventRepository.listByStatus("ACTIVE");
  },
};