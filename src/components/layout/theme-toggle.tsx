/**
 * ThemeToggle — botón sol/luna para alternar modo claro/oscuro.
 *
 * Persiste la elección en cookie (no localStorage) para que el servidor
 * la lea en el siguiente render y no haya flash. El toggle aplica el
 * cambio al instante sin recargar.
 */

"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

const COOKIE_KEY = "tecscore-theme";
const ONE_YEAR = 60 * 60 * 24 * 365;

function readCurrentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function writeCookie(value: Theme): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
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
    writeCookie(next);
  }

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
