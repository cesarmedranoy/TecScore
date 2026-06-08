/**
 * Server actions para notificaciones.
 */

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { notificationRepository } from "@/server/repositories";

export async function fetchMyNotifications() {
  const session = await auth();
  if (!session?.user) return { notifications: [], unread: 0 };
  const [notifications, unread] = await Promise.all([
    notificationRepository.listByUser(session.user.userId, 20),
    notificationRepository.countUnread(session.user.userId),
  ]);
  return { notifications, unread };
}

export async function markNotifReadAction(notifId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await notificationRepository.markAsRead(session.user.userId, notifId);
  revalidatePath("/");
}

export async function markAllNotifsReadAction(): Promise<void> {
  const session = await auth();
  if (!session?.user) return;
  await notificationRepository.markAllAsRead(session.user.userId);
  revalidatePath("/");
}
