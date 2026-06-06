# TecScore

App de predicciones del Mundial con sistema de puntos gamificado.
Proyecto académico — curso "Desarrollo de Soluciones en la Nube", Tecsup.

## Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **UI**: shadcn/ui + Framer Motion + React Three Fiber
- **Backend**: Next.js API Routes + AWS SDK v3
- **DB**: DynamoDB (AWS real en prod, DynamoDB Local vía Docker en dev)
- **Auth**: Auth.js v5 con Google OAuth
- **Cache**: Upstash Redis (Fase 7)
- **Real-time**: Pusher Channels (Fase 6)

## Requisitos previos

- Node.js 18+ (probado con 22)
- npm 10+
- Docker Desktop (para DynamoDB Local)
- Una cuenta AWS con un IAM user que tenga acceso a DynamoDB (para producción)

## Setup

### 1. Clonar e instalar dependencias

```bash
git clone <repo>
cd TecScore
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local`. Para empezar a desarrollar localmente **NO necesitas credenciales AWS reales** — los valores por defecto apuntan a DynamoDB Local (Docker).

### 3. Levantar DynamoDB Local

```bash
npm run db:up        # arranca DynamoDB Local en :8000 + UI admin en :8001
npm run db:setup     # crea las 12 tablas y siembra el admin allowlist
```

Inspector visual de tablas: <http://localhost:8001>

### 4. Arrancar la app

```bash
npm run dev          # localhost:3000
```

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Next.js |
| `npm run build` | Build de producción |
| `npm run start` | Servir el build |
| `npm run lint` | Lint con ESLint |
| `npm run typecheck` | Verificar tipos sin compilar |
| `npm run db:up` | Levantar DynamoDB Local en Docker |
| `npm run db:down` | Apagar el contenedor |
| `npm run db:setup` | Crear/verificar todas las tablas (idempotente) |
| `npm run db:reset` | Destruir todas las tablas (solo local) |

## Trabajar contra AWS real

Cuando quieras probar contra DynamoDB en tu cuenta AWS:

1. En `.env.local`, comenta la línea `DYNAMODB_ENDPOINT=...`.
2. Reemplaza `AWS_ACCESS_KEY_ID` y `AWS_SECRET_ACCESS_KEY` por las credenciales de tu IAM user.
3. (Opcional) Cambia `TABLE_PREFIX=dev_` a `staging_` o `prod_` para no mezclar entornos.
4. Corre `npm run db:setup` para crear las tablas en AWS.

## Arquitectura

Ver `docs/` para decisiones de arquitectura (ADRs) y diagramas.

## Convenciones

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, etc.)
- **Branches**: `feat/*`, `fix/*`, `chore/*` — mergeo a `main` vía PR.
- **TypeScript**: modo estricto, evitar `any`.
- **Repositories**: única capa que habla con DynamoDB.
