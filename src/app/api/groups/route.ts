/**
 * POST   /api/groups   → crear grupo
 * GET    /api/groups   → listar grupos del usuario logueado
 */

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { createGroupSchema } from "@/server/schemas/group";
import {
  groupService,
  GroupLimitReachedError,
} from "@/server/services/group-service";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Input inválido", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const group = await groupService.createGroup({
      ownerId: session.user.userId,
      ...parsed.data,
    });
    return NextResponse.json(group, { status: 201 });
  } catch (err) {
    if (err instanceof GroupLimitReachedError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const groups = await groupService.listMyGroups(session.user.userId);
  return NextResponse.json({ groups });
}
