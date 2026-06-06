/**
 * Toaster — wrapper de sonner con estilos de marca TecScore.
 *
 * Va una sola vez en RootLayout. Después, cualquier componente
 * cliente puede llamar `toast.success("...")`, `toast.error("...")`, etc.
 */

"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg border border-border bg-card text-card-foreground shadow-lg",
        },
      }}
    />
  );
}
