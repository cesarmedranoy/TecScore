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
    preset === "custom" ||
    /^flag:[A-Za-zÁÉÍÓÚÑáéíóúñ ]+$/.test(preset);
  if (!isValid) return { error: "Avatar inválido" };

  await userRepository.updateProfile(session.user.userId, {
    avatarPreset: preset,
  });
  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  return { success: "Avatar actualizado" };
}

/** Guarda la foto custom (data URL JPEG ~30KB). */
export async function uploadCustomAvatarAction(
  dataUrl: string,
): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  if (!dataUrl.startsWith("data:image/jpeg;base64,")) {
    return { error: "Formato inválido (se espera JPEG)" };
  }
  // Limite duro de 400KB (DynamoDB) — dejamos un margen de 350KB.
  if (dataUrl.length > 350_000) {
    return { error: "La imagen es muy grande. Bájale la calidad." };
  }
  await userRepository.updateProfile(session.user.userId, {
    customAvatarDataUrl: dataUrl,
    avatarPreset: "custom",
  });
  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  return { success: "Foto actualizada" };
}

/** Elimina la foto custom (vuelve al preset elegido o Google). */
export async function removeCustomAvatarAction(): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };
  await userRepository.updateProfile(session.user.userId, {
    customAvatarDataUrl: null,
    avatarPreset: "google",
  });
  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  return { success: "Foto eliminada" };
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
