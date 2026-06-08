/**
 * Server actions de la sección "Mis grupos".
 *
 * Llamadas directamente desde formularios con `action={...}`.
 * Devuelven un objeto de estado para que la UI muestre errores
 * sin recargar la página entera.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  groupService,
  GroupLimitReachedError,
  GroupFullError,
  GroupNotFoundError,
  OwnerCannotLeaveError,
  NotGroupOwnerError,
  HasPendingRequestError,
} from "@/server/services/group-service";
import { AlreadyMemberError } from "@/server/repositories";
import { createGroupSchema, joinGroupSchema } from "@/server/schemas/group";

export interface ActionState {
  error?: string;
  success?: string;
  details?: Record<string, string[]>;
}

export async function createGroupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || undefined,
    visibility:
      formData.get("visibility") === "PRIVATE" ? "PRIVATE" : "PUBLIC",
  };

  const parsed = createGroupSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      error: "Revisá los campos",
      details: flat.fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const group = await groupService.createGroup({
      ownerId: session.user.userId,
      ...parsed.data,
    });
    revalidatePath("/mis-grupos");
    redirect(`/mis-grupos/${group.groupId}?welcome=created`);
  } catch (err) {
    if (err instanceof GroupLimitReachedError) {
      return { error: "Ya estás en 5 grupos. Salí de uno antes." };
    }
    throw err;
  }
}

export async function joinGroupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const raw = { code: String(formData.get("code") ?? "").trim() };
  const parsed = joinGroupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Código inválido — son 8 caracteres" };
  }

  try {
    const result = await groupService.joinByCode({
      userId: session.user.userId,
      code: parsed.data.code,
    });
    revalidatePath("/mis-grupos");
    if (result.status === "JOINED") {
      redirect(`/mis-grupos/${result.group.groupId}?welcome=joined`);
    }
    return {
      success: `Solicitud enviada a "${result.group.name}". El owner tiene 12h para decidir.`,
    };
  } catch (err) {
    if (err instanceof GroupNotFoundError) {
      return { error: "No existe ningún grupo con ese código" };
    }
    if (err instanceof AlreadyMemberError) {
      return { error: "Ya sos miembro de ese grupo" };
    }
    if (err instanceof GroupLimitReachedError) {
      return { error: "Ya estás en 5 grupos" };
    }
    if (err instanceof GroupFullError) {
      return { error: "El grupo está lleno" };
    }
    if (err instanceof HasPendingRequestError) {
      return { error: err.message };
    }
    throw err;
  }
}

/** Cancela una solicitud pendiente del propio usuario. */
export async function cancelMyRequestAction(
  groupId: string,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };
  await groupService.cancelMyRequest({
    userId: session.user.userId,
    groupId,
  });
  revalidatePath("/mis-grupos");
  return { success: "Solicitud cancelada" };
}

export async function leaveGroupAction(groupId: string): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  try {
    await groupService.leaveGroup({
      groupId,
      userId: session.user.userId,
    });
    revalidatePath("/mis-grupos");
    redirect("/mis-grupos");
  } catch (err) {
    if (err instanceof OwnerCannotLeaveError) {
      return { error: "Sos owner — eliminá el grupo en vez de salir" };
    }
    if (err instanceof GroupNotFoundError) {
      return { error: "El grupo ya no existe" };
    }
    throw err;
  }
}

export async function changeVisibilityAction(
  groupId: string,
  visibility: "PUBLIC" | "PRIVATE",
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };
  try {
    await groupService.changeVisibility({
      groupId,
      actorId: session.user.userId,
      visibility,
    });
    revalidatePath(`/mis-grupos/${groupId}`);
    return {
      success: `Grupo cambiado a ${visibility === "PUBLIC" ? "público" : "privado"}`,
    };
  } catch (err) {
    if (err instanceof GroupNotFoundError) {
      return { error: "El grupo ya no existe" };
    }
    if (err instanceof NotGroupOwnerError) {
      return { error: "Solo el owner puede cambiar la visibilidad" };
    }
    throw err;
  }
}

export async function deleteGroupAction(groupId: string): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  try {
    await groupService.deleteGroup({
      groupId,
      actorId: session.user.userId,
      actorIsSystemAdmin: session.user.role === "ADMIN",
    });
    revalidatePath("/mis-grupos");
    redirect("/mis-grupos");
  } catch (err) {
    if (err instanceof NotGroupOwnerError) {
      return { error: "Solo el owner puede eliminar el grupo" };
    }
    if (err instanceof GroupNotFoundError) {
      return { error: "El grupo ya no existe" };
    }
    throw err;
  }
}
