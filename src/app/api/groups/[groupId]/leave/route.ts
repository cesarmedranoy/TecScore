/**
 * POST /api/groups/:groupId/leave — abandonar un grupo.
 *
 * El owner NO puede abandonar (debe eliminar el grupo).
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  groupService,
  GroupNotFoundError,
  OwnerCannotLeaveError,
} from "@/server/services/group-service";

type Params = Promise<{ groupId: string }>;

export async function POST(
  _req: Request,
  { params }: { params: Params },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { groupId } = await params;

  try {
    await groupService.leaveGroup({
      groupId,
      userId: session.user.userId,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof GroupNotFoundError) {
      return NextResponse.json({ error: "Grupo no existe" }, { status: 404 });
    }
    if (err instanceof OwnerCannotLeaveError) {
      return NextResponse.json(
        { error: "El owner no puede abandonar. Eliminá el grupo." },
        { status: 409 },
      );
    }
    throw err;
  }
}
