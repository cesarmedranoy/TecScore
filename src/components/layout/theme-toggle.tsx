/**
 * ThemeToggle — botón sol/luna para alternar modo claro/oscuro.
 *
 * Persiste la elección en localStorage y respeta `prefers-color-scheme`
 * del sistema si el usuario no eligió nunca.
 *
 * El "flash" inicial lo previene un script inline en RootLayout, por
 * eso aquí solo leemos el estado actual y reaccionamos al click.
 */

"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function readCurrentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeToggle({
  className,
  variant = "ghost",
}: {
  className?: string;
  variant?: "ghost" | "outline";
}) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readCurrentTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("tecscore-theme", next);
    } catch {}
  }

  // Pre-mount: render placeholder para evitar mismatch de hidratación
  if (!mounted) {
    return (
      <Button variant={variant} size="icon" className={className} aria-hidden>
        <Sun />
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={toggle}
      className={className}
      title={theme === "dark" ? "Cambiar a claro" : "Cambiar a oscuro"}
      aria-label="Cambiar tema"
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
