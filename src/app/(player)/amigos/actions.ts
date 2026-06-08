/**
 * Server actions para amistades.
 */

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  friendshipService,
  CannotFriendSelfError,
  AlreadyFriendsOrPendingError,
  NoFriendRequestError,
} from "@/server/services/friendship-service";

export interface FriendActionState {
  error?: string;
  success?: string;
}

export async function sendFriendRequestAction(
  targetUserId: string,
): Promise<FriendActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };
  try {
    await friendshipService.sendRequest(session.user.userId, targetUserId);
    revalidatePath("/amigos");
    revalidatePath("/buscar");
    return { success: "Solicitud enviada" };
  } catch (err) {
    if (err instanceof CannotFriendSelfError) return { error: err.message };
    if (err instanceof AlreadyFriendsOrPendingError)
      return { error: err.message };
    throw err;
  }
}

export async function acceptFriendRequestAction(
  senderId: string,
): Promise<FriendActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };
  try {
    await friendshipService.acceptRequest(session.user.userId, senderId);
    revalidatePath("/amigos");
    return { success: "¡Ahora son amigos!" };
  } catch (err) {
    if (err instanceof NoFriendRequestError) return { error: err.message };
    throw err;
  }
}

export async function rejectOrCancelFriendAction(
  otherId: string,
): Promise<FriendActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };
  await friendshipService.rejectOrCancel(session.user.userId, otherId);
  revalidatePath("/amigos");
  revalidatePath("/buscar");
  return { success: "Solicitud descartada" };
}

export async function removeFriendAction(
  friendId: string,
): Promise<FriendActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };
  await friendshipService.removeFriendship(session.user.userId, friendId);
  revalidatePath("/amigos");
  return { success: "Amistad eliminada" };
}
