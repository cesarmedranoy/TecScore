# 05 — Mejorar página de ayuda

## Qué hay que hacer

La página `/ayuda` ya tiene un FAQ básico. Hay que enriquecerla con:

- Más preguntas (al menos 12-15 en total)
- Categorías (Cuenta, Predicciones, Grupos, Puntos, Soporte)
- Buscador (filtrado en cliente)
- Diseño más atractivo

## Dónde está el archivo

`src/app/(player)/ayuda/page.tsx`

## Pasos sugeridos

### 1. Estructurar los FAQs

```tsx
const FAQ_CATEGORIES = [
  {
    id: "cuenta",
    label: "Mi cuenta",
    icon: User,
    items: [
      { q: "¿Cómo cambio mi avatar?", a: "..." },
      { q: "¿Puedo cambiar mi tag?", a: "..." },
      // ...
    ],
  },
  {
    id: "predicciones",
    label: "Predicciones",
    icon: TrendingUp,
    items: [...],
  },
  // ...
];
```

### 2. Convertir a Client Component para el buscador

```tsx
"use client";
// useState para el query del buscador
// filter las items en cliente
```

### 3. Diseño con tabs (opcional, queda lindo)

Podés crear un componente `Tabs` similar a shadcn/ui y separar por categoría.

## Preguntas sugeridas para agregar

- ¿Cómo funciona el bonus de racha exactamente?
- ¿Qué pasa si predigo un partido suspendido?
- ¿Hay límite de cuántos grupos puedo crear yo?
- ¿Cómo se elige al admin de un grupo? ¿Puedo transferir ese rol?
- ¿Qué emails están permitidos para registrarse?
- ¿Por qué no aparezco en el ranking global?
- ¿Cuándo se actualiza el ranking?
- ¿Cómo invito a alguien que no tiene cuenta?
- ¿Los puntos del Mundial vencen?
- ¿Hay app móvil?

## Acceptance criteria

- [ ] Al menos 12 FAQs distribuidos en categorías
- [ ] Cada categoría con su icono
- [ ] Buscador funcional que filtra por palabra clave
- [ ] Diseño coherente con el resto de la app (usa los mismos `Card`,
      `Badge`, etc.)

## Esfuerzo

1-2 horas si redactás rápido.
