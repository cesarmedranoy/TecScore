/**
 * POST /api/groups/join — unirse a un grupo vía código.
 *
 * Body: { "code": "ABCD-1234" }
 *
 * Respuesta:
 *   - PUBLIC → 200 { status: "JOINED", group }
 *   - PRIVATE → 202 { status: "REQUESTED", group, request }
 */

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { joinGroupSchema } from "@/server/schemas/group";
import {
  groupService,
  GroupLimitReachedError,
  GroupFullError,
  GroupNotFoundError,
} from "@/server/services/group-service";
import { AlreadyMemberError } from "@/server/repositories";

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
  const parsed = joinGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Código inválido", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await groupService.joinByCode({
      userId: session.user.userId,
      code: parsed.data.code,
    });
    const status = result.status === "JOINED" ? 200 : 202;
    return NextResponse.json(result, { status });
  } catch (err) {
    if (err instanceof GroupNotFoundError) {
      return NextResponse.json(
        { error: "No existe ningún grupo con ese código" },
        { status: 404 },
      );
    }
    if (err instanceof AlreadyMemberError) {
      return NextResponse.json(
        { error: "Ya sos miembro de ese grupo" },
        { status: 409 },
      );
    }
    if (err instanceof GroupLimitReachedError) {
      return NextResponse.json(
        { error: "Ya estás en el máximo de 5 grupos" },
        { status: 409 },
      );
    }
    if (err instanceof GroupFullError) {
      return NextResponse.json({ error: "El grupo está lleno" }, { status: 409 });
    }
    throw err;
  }
}
