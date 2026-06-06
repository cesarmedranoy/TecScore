/**
 * POST /api/groups/:groupId/requests/:userId — decidir solicitud.
 *
 * Body: { "decision": "APPROVE" | "REJECT" }
 *
 * Solo el owner del grupo (o admin del sistema) puede.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  groupService,
  GroupNotFoundError,
  NotGroupOwnerError,
  RequestExpiredError,
  NoPendingRequestError,
  GroupLimitReachedError,
  GroupFullError,
} from "@/server/services/group-service";

const decisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
});

type Params = Promise<{ groupId: string; userId: string }>;

export async function POST(
  req: NextRequest,
  { params }: { params: Params },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { groupId, userId: targetUserId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Decisión inválida (APPROVE o REJECT)" },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.decision === "APPROVE") {
      await groupService.approveRequest({
        groupId,
        ownerId: session.user.userId,
        targetUserId,
      });
    } else {
      await groupService.rejectRequest({
        groupId,
        ownerId: session.user.userId,
        targetUserId,
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof GroupNotFoundError) {
      return NextResponse.json({ error: "Grupo no existe" }, { status: 404 });
    }
    if (err instanceof NotGroupOwnerError) {
      return NextResponse.json(
        { error: "Solo el owner decide solicitudes" },
        { status: 403 },
      );
    }
    if (err instanceof NoPendingRequestError) {
      return NextResponse.json(
        { error: "No hay solicitud pendiente" },
        { status: 404 },
      );
    }
    if (err instanceof RequestExpiredError) {
      return NextResponse.json(
        { error: "La solicitud expiró (>12h)" },
        { status: 410 },
      );
    }
    if (err instanceof GroupLimitReachedError) {
      return NextResponse.json(
        { error: "El solicitante ya está en 5 grupos" },
        { status: 409 },
      );
    }
    if (err instanceof GroupFullError) {
      return NextResponse.json({ error: "El grupo está lleno" }, { status: 409 });
    }
    throw err;
  }
}
