/**
 * GET    /api/groups/:groupId — detalle del grupo + ranking de miembros
 * DELETE /api/groups/:groupId — eliminar grupo (owner o admin del sistema)
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  groupRepository,
  groupMemberRepository,
  userRepository,
} from "@/server/repositories";
import {
  groupService,
  GroupNotFoundError,
  NotGroupOwnerError,
} from "@/server/services/group-service";

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

  // Solo miembros o admin del sistema pueden ver el detalle
  const isMember = await groupMemberRepository.isMember(
    groupId,
    session.user.userId,
  );
  if (!isMember && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  // Armar ranking: para cada miembro, traer su user y ordenar por puntos
  const members = await groupMemberRepository.listByGroup(groupId);
  const ranking = [];
  for (const m of members) {
    const user = await userRepository.getById(m.userId);
    if (!user) continue;
    ranking.push({
      userId: user.userId,
      displayName: user.displayName,
      tag: user.tag,
      avatarUrl: user.avatarUrl,
      avatarPreset: user.avatarPreset ?? "google",
      customAvatarDataUrl: user.customAvatarDataUrl,
      totalPoints: user.totalPoints,
      currentStreak: user.currentStreak,
      joinedAt: m.joinedAt,
    });
  }
  ranking.sort((a, b) => b.totalPoints - a.totalPoints);

  return NextResponse.json({ group, ranking });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Params },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { groupId } = await params;

  try {
    await groupService.deleteGroup({
      groupId,
      actorId: session.user.userId,
      actorIsSystemAdmin: session.user.role === "ADMIN",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof GroupNotFoundError) {
      return NextResponse.json({ error: "Grupo no existe" }, { status: 404 });
    }
    if (err instanceof NotGroupOwnerError) {
      return NextResponse.json(
        { error: "Solo el owner puede eliminar el grupo" },
        { status: 403 },
      );
    }
    throw err;
  }
}
