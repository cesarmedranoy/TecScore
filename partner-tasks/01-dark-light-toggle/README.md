# 01 — Toggle dark / light mode con persistencia

## Qué hay que hacer

Agregar un botón que alterna entre modo claro y oscuro, con la elección del
usuario **persistida** (que no se pierda al refrescar o entre sesiones).

## Por qué

El sistema de colores ya está listo en `src/app/globals.css` con variables
CSS para `:root` (light) y `.dark` (dark). Solo falta el toggle que añade/
quita la clase `dark` del `<html>`.

## Dónde ponerlo en la UI

En el `PlayerSidebar` y `AdminSidebar` (al final, junto al sign-out), o en el
header. Decidí lo que se vea mejor.

## Pasos sugeridos

### 1. Crear el componente toggle

`src/components/layout/theme-toggle.tsx`:

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Leer del localStorage al montar
  useEffect(() => {
    const saved = (localStorage.getItem("tecscore-theme") as "light" | "dark") ?? "light";
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("tecscore-theme", next);
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggle}>
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
```

### 2. Evitar el "flash of light" al cargar

El problema: el server renderiza con clase vacía. Si el user prefiere dark,
ve un flash blanco antes de que JS aplique `.dark`.

Solución: agregar un script inline en `src/app/layout.tsx` ANTES del `<body>`:

```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `
      try {
        const t = localStorage.getItem("tecscore-theme");
        if (t === "dark") document.documentElement.classList.add("dark");
      } catch {}
    `,
  }}
/>
```

### 3. Importarlo en los sidebars

En `player-sidebar.tsx` y `admin-sidebar.tsx`, agregalo donde te parezca.

## Acceptance criteria

- [ ] Click en el toggle cambia entre light y dark
- [ ] La preferencia se persiste (cerrá el browser, volvé, sigue como la
      dejaste)
- [ ] **Cero flash** de color incorrecto al cargar la app
- [ ] Funciona en `/dashboard`, `/admin`, `/login`, `/`

## Tips

- Probá en ambos roles (PLAYER y ADMIN) y en todas las páginas.
- Si querés ser fancy: detectar `prefers-color-scheme` del sistema como
  default antes de tocar localStorage.
- Mirá `src/app/globals.css` para entender qué variables existen — no
  inventes colores nuevos.

## Esfuerzo

2-3 horas si nunca lo hiciste, 1 hora si ya conocés el patrón.
