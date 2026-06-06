/**
 * GET /api/groups/:groupId/requests — solicitudes pendientes (solo owner).
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  groupRepository,
  groupRequestRepository,
  userRepository,
} from "@/server/repositories";

type Params = Promise<{ groupId: string }>;

export async function GET(
  _req: Request,
  { params }: { params: Params },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { groupId } = await params;

  const group = await groupRepository.getById(groupId);
  if (!group) {
    return NextResponse.json({ error: "Grupo no existe" }, { status: 404 });
  }
  if (
    group.ownerId !== session.user.userId &&
    session.user.role !== "ADMIN"
  ) {
    return NextResponse.json(
      { error: "Solo el owner ve las solicitudes" },
      { status: 403 },
    );
  }

  const pending = await groupRequestRepository.listPendingByGroup(groupId);
  // Enriquecer con datos del solicitante para mostrar avatar + nombre
  const enriched = [];
  for (const r of pending) {
    const user = await userRepository.getById(r.userId);
    if (!user) continue;
    enriched.push({
      ...r,
      requester: {
        userId: user.userId,
        displayName: user.displayName,
        tag: user.tag,
        avatarUrl: user.avatarUrl,
        avatarPreset: user.avatarPreset ?? "google",
        customAvatarDataUrl: user.customAvatarDataUrl,
      },
    });
  }
  return NextResponse.json({ requests: enriched });
}
