# 03 — 3D Carousel scroll del landing

## Qué hay que hacer

Reemplazar el hero del landing público (`src/app/page.tsx`) por un carousel
3D estilo Webflow, donde tarjetas con info del proyecto giran/scrollean
visualmente al hacer scroll.

## Referencia visual

> Mirá este link que el cliente (Julio) compartió:
> https://webflow.com/made-in-webflow/website/3d-carousel-scroll
>
> Eso es exactamente la vibe que busca: tarjetas en 3D que reaccionan al
> scroll y se sienten premium.

## Stack

React Three Fiber + Drei (helpers utiles).

```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

## Estructura sugerida

```
src/components/carousel-3d/
├── carousel.tsx         # Componente Canvas principal (client component)
├── card-3d.tsx          # Cada tarjeta como mesh 3D
└── use-scroll-progress.ts  # Hook para sincronizar scroll → rotación
```

## Pasos sugeridos

### 1. Setup del Canvas

`carousel.tsx`:

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, ScrollControls, Scroll } from "@react-three/drei";

export function Carousel3D() {
  return (
    <div className="h-screen w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} />
        <ScrollControls pages={3} damping={0.3}>
          {/* Aquí van las tarjetas en círculo */}
        </ScrollControls>
      </Canvas>
    </div>
  );
}
```

### 2. Tarjetas en círculo

Posicionalas en un círculo (XZ plane) usando trigonometría:

```tsx
const N = 6; // cantidad de tarjetas
const RADIUS = 3;

cards.map((card, i) => {
  const angle = (i / N) * Math.PI * 2;
  return (
    <mesh
      key={i}
      position={[Math.sin(angle) * RADIUS, 0, Math.cos(angle) * RADIUS]}
      rotation={[0, angle, 0]}
    >
      <planeGeometry args={[1.5, 2]} />
      <meshStandardMaterial color={card.color} />
    </mesh>
  );
});
```

### 3. Conectar scroll → rotación

Con `useScroll()` de drei dentro del Canvas, leés el offset (0 a 1) y rotás
el grupo entero según el progreso.

```tsx
const scroll = useScroll();
useFrame(() => {
  groupRef.current.rotation.y = scroll.offset * Math.PI * 2;
});
```

### 4. Contenido de las tarjetas

Cada tarjeta debe mostrar:
1. "Predice como un profesional"
2. "Compite con tus amigos"
3. "Bonus por racha"
4. "Bracket de eliminatorias"
5. "Ranking global"
6. "Mundial 2026"

Podés usar `<Text>` de drei para texto dentro del Canvas, o renderizar HTML
encima usando `<Html>` con position absolute.

### 5. Reemplazar el landing

En `src/app/page.tsx`, reemplazá el contenido del `<main>` por:

```tsx
import { Carousel3D } from "@/components/carousel-3d/carousel";
// ...
<Carousel3D />
```

Mantené el redirect si está logueado, y el botón "Comenzar →" en algún lado
visible.

## Acceptance criteria

- [ ] Canvas a pantalla completa en el landing
- [ ] 5-8 tarjetas en círculo 3D
- [ ] Al scrollear, el círculo rota mostrando cada tarjeta de frente
- [ ] Cada tarjeta tiene texto legible (no SVG/imagen genérica)
- [ ] CTA "Comenzar →" siempre visible (sticky o fixed)
- [ ] Animación fluida — sin lag (60fps en máquina normal)
- [ ] Funciona en mobile (con touch scroll)

## Tips

- Empezá con cubos simples para entender los ejes, después decorás.
- Si la performance va mal, bajá `dpr` del Canvas a `[1, 1.5]`.
- Para texto: `<Text>` de drei es la opción más simple, pero `<Html>` te
  permite usar Tailwind si preferís.
- Hacé el `pages={N}` de ScrollControls suficiente para que se complete una
  vuelta entera + un poco más.

## Esfuerzo

6-8 horas (la mitad peleándose con la matemática 3D la primera vez).

## Recursos

- https://r3f.docs.pmnd.rs/getting-started/introduction
- https://drei.pmnd.rs/ — buscá `ScrollControls`, `useScroll`, `Html`, `Text`
