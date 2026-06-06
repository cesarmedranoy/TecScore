/**
 * POST /api/predictions — submitear o actualizar una predicción.
 */

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { submitPredictionSchema } from "@/server/schemas/prediction";
import {
  predictionService,
  MatchClosedForPredictionsError,
  MatchNotFoundError,
} from "@/server/services/prediction-service";

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
  const parsed = submitPredictionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Input inválido", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const prediction = await predictionService.submit({
      userId: session.user.userId,
      ...parsed.data,
    });
    return NextResponse.json(prediction, { status: 200 });
  } catch (err) {
    if (err instanceof MatchNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    if (err instanceof MatchClosedForPredictionsError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
