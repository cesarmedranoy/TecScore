/**
 * GET /api/users/:userId/relation — la relación entre el current user y :userId.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getRelation } from "@/server/repositories";

interface Ctx {
  params: Promise<{ userId: string }>;
}

export async function GET(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { userId } = await params;
  const relation = await getRelation(session.user.userId, userId);
  return NextResponse.json({ relation });
}
