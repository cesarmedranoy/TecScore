@AGENTS.md

# TecScore — Contexto del proyecto

**App de predicciones del Mundial** que es proyecto académico de la semana 12 del curso "Desarrollo de Soluciones en la Nube" (Tecsup, sección 5-C24 ABCD, profesor Jaime Farfán). Evaluado como concurso: la app ganadora será desplegada por el profesor en un dominio real.

## Decisiones fijas (no negociar)

- **DB**: AWS DynamoDB (decisión del curso). Para dev local usamos **DynamoDB Local** vía Docker — misma API.
- **Auth**: Solo Google OAuth. El rol (PLAYER vs ADMIN) se resuelve por **allowlist en DynamoDB** (tabla `AdminAllowlist`) — sin botón "elegir rol".
- **Stack**: Next.js 16 App Router + TS + Tailwind v4 + shadcn/ui + Framer Motion + React Three Fiber.
- **Carga**: app debe sostener ≥5000 req/h con picos masivos cuando admin marca resultados (todos los puntos se calculan en simultáneo).

## Reglas de puntuación (críticas, no improvisar)

| Regla | Puntos |
|---|---|
| Resultado exacto (marcador correcto) | **5** |
| Ganador correcto (o empate) | **3** |
| Diferencia de goles correcta | **2** |
| Bonus por racha (cada 3 aciertos consecutivos) | **+2** |
| Predicción anticipada (>24h antes del kickoff) | **+1** |

Predicciones de <10min antes del kickoff: solo puntos base, sin bonus.

## Estructura del repo

```
src/
├── app/                Next.js App Router
├── components/
│   ├── ui/             shadcn primitives
│   ├── gamified/       Componentes propios (PlayerCard, BetCard, etc.)
│   ├── carousel-3d/    R3F 3D carousel del landing
│   └── layout/         Navbar, Sidebar
├── lib/
│   ├── aws/            Cliente DynamoDB con routing local/AWS
│   ├── auth/           Auth.js config (Fase 2)
│   ├── scoring/        Motor de puntos (funciones puras)
│   └── cache/          Redis client (Fase 7)
├── server/
│   ├── repositories/   Acceso a datos por entidad
│   ├── services/       Lógica de negocio
│   └── schemas/        Validación con Zod
├── types/              Tipos compartidos del dominio
└── hooks/              React hooks custom
scripts/                Setup/reset de tablas (mismo código local + AWS)
docker/                 Volume de DynamoDB Local
docs/                   ADRs y documentación
```

## Comandos clave

```bash
npm run dev          # arranca Next.js en :3000
npm run db:up        # levanta DynamoDB Local en :8000 + UI admin en :8001
npm run db:setup     # crea las 12 tablas (idempotente)
npm run db:reset     # destruye tablas (solo local, bloqueado contra AWS real)
npm run db:down      # apaga el contenedor
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
```

## Convenciones de código

- **TypeScript estricto**. Nada de `any` salvo en el límite con APIs externas.
- **Funciones puras** para lógica de negocio (especialmente scoring): facilita tests sin mockear DynamoDB.
- **Repositories** son la única capa que toca DynamoDB. El resto del código habla con repos, nunca con `ddb` directo.
- **Zod** valida todo input externo (request bodies, env vars críticas).
- **ULIDs** como sort keys cuando se necesita orden cronológico (chats, notifs, audit).
- **Idempotencia**: cualquier operación que afecte puntos debe ser idempotente.

## Convenciones de commits

Conventional Commits: `tipo(scope): descripción`.
Tipos: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`.

## Estado actual (fases)

1. ✅ Fase 1: Infraestructura AWS + scaffold Next.js (en curso al momento de escribir)
2. ⬜ Fase 2: Auth Google + roles
3. ⬜ Fase 3: Modelo de datos + scoring engine
4. ⬜ Fase 4: Sistema de grupos
5. ⬜ Fase 5: Dashboards gamificados
6. ⬜ Fase 6: Tiempo real (chat + notifs)
7. ⬜ Fase 7: IA + stress test + despliegue
