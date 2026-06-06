# Partner tasks — TecScore

Hola compañero! Esta carpeta tiene tu 25% del proyecto. Cada carpeta numerada es
una tarea independiente con su propio README. Podés tomarlas en cualquier
orden, pero te recomiendo arrancar por la 01 (más simple) e ir subiendo.

## Setup inicial

Antes de tocar código, leé el README de la raíz del repo y dejá la app
corriendo localmente:

```bash
git clone <repo>
cd TecScore
npm install
cp .env.example .env.local
npm run db:up
npm run db:setup
npm run dev
```

Abrí <http://localhost:3000> y logueate con tu Google. Tendrás rol PLAYER
(no estás en la AdminAllowlist), eso está bien para todas estas tareas.

## Tareas

| # | Tarea | Esfuerzo aprox | Stack |
|---|---|---|---|
| **01** | Toggle dark/light mode con persistencia | 2-3 hs | Cookie + useTheme hook |
| **02** | Reproductor de música del lobby | 3-4 hs | Howler.js |
| **03** | 3D carousel scroll del landing | 6-8 hs | React Three Fiber |
| **04** | Skeleton loaders para cada vista | 3-4 hs | CSS shimmer |
| **05** | Mejorar página de ayuda | 1-2 hs | Solo Markdown/JSX |
| **06** | Stress tests con k6 + documentación | 4-5 hs | k6 + Markdown |
| **07** | README final + capturas + video demo | 2-3 hs | Capturas + grabación |

**Total aproximado: 21-29 hs** — coordiná con Julio si necesitás más tiempo en
alguna o si querés dejar alguna afuera del MVP final.

## Convenciones del proyecto (importante leer)

- **Commits**: en español, minúsculas, una oración corta. Ejemplos:
  - `agregar toggle dark mode`
  - `agregar reproductor de musica del lobby`
  - `arreglar skeleton de cards de partido`
  - NO uses `feat(scope): ...` ni firmes con Co-Authored-By Claude.
- **TypeScript estricto**: nada de `any`.
- **Tailwind v4** + variables CSS en `src/app/globals.css`.
- **shadcn/ui pattern** para componentes (no la lib, los componentes están en
  `src/components/ui/`).
- **Lucide icons** en lugar de emojis o iconos custom.
- Antes de pushear: `npm run typecheck && npm run test && npm run lint`.

## Cómo pedir ayuda

Si te trabás, mandale captura + descripción a Julio. Si es un tema técnico
profundo, podemos abrirlo juntos.
