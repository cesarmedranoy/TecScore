/**
 * Group service — toda la lógica de negocio de grupos.
 *
 * Reglas de negocio centralizadas:
 *  - Límite de 5 grupos por usuario (entrada Y salida).
 *  - Máximo 50 miembros por grupo (configurable por grupo).
 *  - Código de invitación único (retry hasta 5 veces si colisión).
 *  - Públicos: el código une directo.
 *  - Privados: el código crea una solicitud que expira en 12h.
 *  - Owner no puede abandonar — debe eliminar el grupo.
 *  - Solo el owner puede eliminar el grupo o decidir solicitudes.
 *
 * Los repositorios NO conocen estas reglas — son CRUD puro.
 * Toda lógica que combine varios repos vive acá.
 */

import {
  groupRepository,
  groupMemberRepository,
  groupRequestRepository,
  AlreadyMemberError,
  REQUEST_TTL_HOURS,
  isRequestExpired,
} from "@/server/repositories";
import { generateJoinCode } from "@/lib/groups/join-code";
import { newId, now } from "@/lib/utils";
import type { Group, GroupMember, GroupRequest, GroupVisibility } from "@/types";

// ============================================================================
// Errores específicos del dominio de grupos
// ============================================================================

export class GroupLimitReachedError extends Error {
  constructor(userId: string) {
    super(`Usuario ${userId} ya está en el máximo de 5 grupos`);
    this.name = "GroupLimitReachedError";
  }
}

export class GroupFullError extends Error {
  constructor(groupId: string) {
    super(`El grupo ${groupId} está lleno`);
    this.name = "GroupFullError";
  }
}

export class NotGroupOwnerError extends Error {
  constructor(groupId: string, userId: string) {
    super(`Usuario ${userId} no es owner del grupo ${groupId}`);
    this.name = "NotGroupOwnerError";
  }
}

export class OwnerCannotLeaveError extends Error {
  constructor(groupId: string) {
    super(
      `Owner no puede abandonar grupo ${groupId} — debe eliminarlo primero`,
    );
    this.name = "OwnerCannotLeaveError";
  }
}

export class GroupNotFoundError extends Error {
  constructor(groupId: string) {
    super(`Grupo ${groupId} no existe`);
    this.name = "GroupNotFoundError";
  }
}

export class RequestExpiredError extends Error {
  constructor() {
    super(`La solicitud ya expiró (>12h)`);
    this.name = "RequestExpiredError";
  }
}

export class NoPendingRequestError extends Error {
  constructor(userId: string) {
    super(`No hay solicitud pendiente para usuario ${userId}`);
    this.name = "NoPendingRequestError";
  }
}

// ============================================================================
// Constantes
// ============================================================================

export const MAX_GROUPS_PER_USER = 5;
export const DEFAULT_MAX_MEMBERS = 50;
const JOIN_CODE_MAX_RETRIES = 5;

// ============================================================================
// Service
// ============================================================================

export const groupService = {
  /**
   * Crea un grupo. El creador se vuelve owner Y primer miembro.
   *
   * Validaciones:
   *  - Usuario no superó MAX_GROUPS_PER_USER
   *  - Código generado es único (retry si colisión)
   */
  async createGroup(params: {
    ownerId: string;
    name: string;
    description?: string;
    visibility: GroupVisibility;
    maxMembers?: number;
  }): Promise<Group> {
    const count = await groupMemberRepository.countByUser(params.ownerId);
    if (count >= MAX_GROUPS_PER_USER) {
      throw new GroupLimitReachedError(params.ownerId);
    }

    // Generar código único con retry
    let joinCode = "";
    let attempt = 0;
    while (attempt < JOIN_CODE_MAX_RETRIES) {
      const candidate = generateJoinCode();
      const existing = await groupRepository.getByJoinCode(candidate);
      if (!existing) {
        joinCode = candidate;
        break;
      }
      attempt++;
    }
    if (!joinCode) {
      throw new Error(
        `No se pudo generar un código único tras ${JOIN_CODE_MAX_RETRIES} intentos`,
      );
    }

    const group: Group = {
      groupId: newId(),
      name: params.name,
      description: params.description,
      ownerId: params.ownerId,
      visibility: params.visibility,
      joinCode,
      memberCount: 1, // el owner se suma de una
      maxMembers: params.maxMembers ?? DEFAULT_MAX_MEMBERS,
      createdAt: now(),
    };

    await groupRepository.create(group);
    await groupMemberRepository.add({
      groupId: group.groupId,
      userId: params.ownerId,
      joinedAt: group.createdAt,
      pointsInGroup: 0,
    });

    return group;
  },

  /**
   * Une un usuario a un grupo vía código.
   *
   * Si el grupo es PUBLIC → lo agrega como miembro directo.
   * Si es PRIVATE → crea una solicitud que expira en 12h.
   *
   * Devuelve qué acción se realizó para que la UI lo refleje.
   */
  async joinByCode(params: {
    userId: string;
    code: string;
  }): Promise<
    | { status: "JOINED"; group: Group }
    | { status: "REQUESTED"; group: Group; request: GroupRequest }
  > {
    const group = await groupRepository.getByJoinCode(params.code);
    if (!group) {
      throw new GroupNotFoundError(`code=${params.code}`);
    }

    const alreadyMember = await groupMemberRepository.isMember(
      group.groupId,
      params.userId,
    );
    if (alreadyMember) {
      throw new AlreadyMemberError(group.groupId, params.userId);
    }

    const userGroupCount = await groupMemberRepository.countByUser(
      params.userId,
    );
    if (userGroupCount >= MAX_GROUPS_PER_USER) {
      throw new GroupLimitReachedError(params.userId);
    }

    if (group.memberCount >= group.maxMembers) {
      throw new GroupFullError(group.groupId);
    }

    if (group.visibility === "PUBLIC") {
      await groupMemberRepository.add({
        groupId: group.groupId,
        userId: params.userId,
        joinedAt: now(),
        pointsInGroup: 0,
      });
      await groupRepository.adjustMemberCount(group.groupId, 1);
      return { status: "JOINED", group: { ...group, memberCount: group.memberCount + 1 } };
    }

    // PRIVATE → crear solicitud
    const requestedAt = now();
    const expiresAt = new Date(
      Date.now() + REQUEST_TTL_HOURS * 60 * 60 * 1000,
    ).toISOString();
    const request: GroupRequest = {
      groupId: group.groupId,
      userId: params.userId,
      requestedAt,
      expiresAt,
      status: "PENDING",
    };
    await groupRequestRepository.create(request);
    return { status: "REQUESTED", group, request };
  },

  /**
   * Aprueba una solicitud pendiente. Solo el owner puede.
   * Si la solicitud expiró, se rechaza con RequestExpiredError.
   */
  async approveRequest(params: {
    groupId: string;
    ownerId: string;
    targetUserId: string;
  }): Promise<void> {
    const group = await groupRepository.getById(params.groupId);
    if (!group) throw new GroupNotFoundError(params.groupId);
    if (group.ownerId !== params.ownerId) {
      throw new NotGroupOwnerError(params.groupId, params.ownerId);
    }

    const request = await groupRequestRepository.get(
      params.groupId,
      params.targetUserId,
    );
    if (!request || request.status !== "PENDING") {
      throw new NoPendingRequestError(params.targetUserId);
    }
    if (isRequestExpired(request)) {
      await groupRequestRepository.setStatus(
        params.groupId,
        params.targetUserId,
        "EXPIRED",
      );
      throw new RequestExpiredError();
    }

    // Revalidar límites del solicitante (pueden haber cambiado)
    const userGroupCount = await groupMemberRepository.countByUser(
      params.targetUserId,
    );
    if (userGroupCount >= MAX_GROUPS_PER_USER) {
      throw new GroupLimitReachedError(params.targetUserId);
    }
    if (group.memberCount >= group.maxMembers) {
      throw new GroupFullError(params.groupId);
    }

    await groupMemberRepository.add({
      groupId: params.groupId,
      userId: params.targetUserId,
      joinedAt: now(),
      pointsInGroup: 0,
    });
    await groupRepository.adjustMemberCount(params.groupId, 1);
    await groupRequestRepository.setStatus(
      params.groupId,
      params.targetUserId,
      "APPROVED",
    );
  },

  async rejectRequest(params: {
    groupId: string;
    ownerId: string;
    targetUserId: string;
  }): Promise<void> {
    const group = await groupRepository.getById(params.groupId);
    if (!group) throw new GroupNotFoundError(params.groupId);
    if (group.ownerId !== params.ownerId) {
      throw new NotGroupOwnerError(params.groupId, params.ownerId);
    }
    await groupRequestRepository.setStatus(
      params.groupId,
      params.targetUserId,
      "REJECTED",
    );
  },

  /**
   * Sale del grupo. Owner NO puede abandonar — debe eliminar el grupo.
   */
  async leaveGroup(params: {
    groupId: string;
    userId: string;
  }): Promise<void> {
    const group = await groupRepository.getById(params.groupId);
    if (!group) throw new GroupNotFoundError(params.groupId);
    if (group.ownerId === params.userId) {
      throw new OwnerCannotLeaveError(params.groupId);
    }
    const member = await groupMemberRepository.get(
      params.groupId,
      params.userId,
    );
    if (!member) return; // ya no estaba, idempotente
    await groupMemberRepository.remove(params.groupId, params.userId);
    await groupRepository.adjustMemberCount(params.groupId, -1);
  },

  /**
   * Elimina el grupo y todos sus miembros + solicitudes.
   * Solo el owner del grupo o un ADMIN del sistema puede.
   */
  async deleteGroup(params: {
    groupId: string;
    actorId: string;
    actorIsSystemAdmin?: boolean;
  }): Promise<void> {
    const group = await groupRepository.getById(params.groupId);
    if (!group) throw new GroupNotFoundError(params.groupId);
    if (group.ownerId !== params.actorId && !params.actorIsSystemAdmin) {
      throw new NotGroupOwnerError(params.groupId, params.actorId);
    }

    // Borrar todos los miembros
    const members = await groupMemberRepository.listByGroup(params.groupId);
    for (const m of members) {
      await groupMemberRepository.remove(m.groupId, m.userId);
    }
    // Borrar el grupo en sí
    await groupRepository.delete(params.groupId);
    // Las solicitudes se quedan con status PENDING pero el grupo no existe;
    // se filtran en read. Igual podríamos limpiarlas en Fase 7 con un batch job.
  },

  /** Lista grupos donde el usuario es miembro, con detalle del grupo. */
  async listMyGroups(userId: string): Promise<Group[]> {
    const memberships = await groupMemberRepository.listByUser(userId);
    const groups: Group[] = [];
    for (const m of memberships) {
      const g = await groupRepository.getById(m.groupId);
      if (g) groups.push(g);
    }
    return groups;
  },
};
