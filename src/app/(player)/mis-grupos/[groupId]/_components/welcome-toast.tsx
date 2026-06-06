/**
 * WelcomeToast — dispara un toast contextual cuando la URL trae
 * `?welcome=created`. Se monta una vez por entrada a la página.
 *
 * Patrón senior: en lugar de hardcodear el toast en la action (que no
 * tiene acceso al cliente), el flujo es:
 *   action → redirect("?welcome=created") → este componente lo lee
 *
 * Tras dispararse, limpiamos el param sin recargar para evitar duplicados.
 */

"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface WelcomeToastProps {
  joinCode: string;
}

export function WelcomeToast({ joinCode }: WelcomeToastProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const flag = searchParams.get("welcome");

  useEffect(() => {
    if (flag === "created") {
      toast.success("🎉 ¡Grupo creado!", {
        description: `Invita a tus amigos con el código ${joinCode}`,
        duration: 6000,
      });
    } else if (flag === "joined") {
      toast.success("¡Bienvenido al grupo!", {
        description: "Predice los próximos partidos para ganar puntos.",
      });
    }
    if (flag) {
      // Limpiar el param sin recargar
      router.replace(window.location.pathname, { scroll: false });
    }
  }, [flag, joinCode, router]);

  return null;
}
