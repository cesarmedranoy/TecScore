/**
 * Server actions de la sección "Perfil".
 */

"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { userRepository } from "@/server/repositories";

export interface ProfileActionState {
  error?: string;
  success?: string;
}

export async function updateAvatarPresetAction(
  preset: string,
): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  // Validar formato del preset
  const isValid =
    preset === "google" ||
    preset === "cup" ||
    /^flag:[A-Za-zÁÉÍÓÚÑáéíóúñ ]+$/.test(preset);
  if (!isValid) return { error: "Avatar inválido" };

  await userRepository.updateProfile(session.user.userId, {
    avatarPreset: preset,
  });
  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  return { success: "Avatar actualizado" };
}

export async function updateDisplayNameAction(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };
  const name = String(formData.get("displayName") ?? "").trim();
  if (name.length < 2 || name.length > 30) {
    return { error: "El nombre debe tener entre 2 y 30 caracteres" };
  }
  await userRepository.updateProfile(session.user.userId, {
    displayName: name,
  });
  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  return { success: "Nombre actualizado" };
}
