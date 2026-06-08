/**
 * Server actions de la sección "Mis apuestas".
 */

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  predictionService,
  MatchClosedForPredictionsError,
  MatchNotFoundError,
  MustBeInGroupError,
} from "@/server/services/prediction-service";

export interface PredictionActionState {
  error?: string;
  success?: string;
}

export async function submitPredictionAction(
  _prev: PredictionActionState,
  formData: FormData,
): Promise<PredictionActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const matchId = String(formData.get("matchId") ?? "");
  const homeScore = Number(formData.get("homeScore"));
  const awayScore = Number(formData.get("awayScore"));

  if (!matchId || !Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
    return { error: "Marcador inválido" };
  }
  if (homeScore < 0 || awayScore < 0 || homeScore > 20 || awayScore > 20) {
    return { error: "Marcador fuera de rango (0 a 20)" };
  }

  try {
    await predictionService.submit({
      userId: session.user.userId,
      matchId,
      homeScore,
      awayScore,
    });
    revalidatePath("/mis-apuestas");
    return { success: `Predicción guardada: ${homeScore} - ${awayScore}` };
  } catch (err) {
    if (err instanceof MatchNotFoundError) {
      return { error: "Ese partido no existe" };
    }
    if (err instanceof MatchClosedForPredictionsError) {
      return { error: "Ya no se aceptan predicciones para este partido" };
    }
    if (err instanceof MustBeInGroupError) {
      return { error: "Únete a un grupo primero para empezar a predecir" };
    }
    throw err;
  }
}
