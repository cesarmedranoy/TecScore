# TecScore 🏆

App de predicciones del Mundial 2026 con sistema de puntos gamificado.  
Proyecto académico — curso **Desarrollo de Soluciones en la Nube**, Tecsup.

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend + Backend | Next.js 16 (App Router) + TypeScript |
| UI | TailwindCSS v4 + shadcn/ui + Motion |
| Base de datos | Amazon DynamoDB (Local en dev, AWS en prod) |
| Autenticación | Auth.js v5 + Google OAuth |
| Balanceo de carga | nginx (least_conn) |
| Contenedores | Docker + Docker Compose |
| Testing de carga | k6 |

---

## Requisitos previos

- **Node.js 20+** (probado con 22)
- **npm 10+**
- **Docker Desktop** — para DynamoDB Local y el stack completo
- **k6** — para pruebas de carga (`winget install k6` en Windows)
- Una cuenta de Google Cloud para las credenciales OAuth

---

## Setup rápido (desarrollo local)

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

Edita `.env.local` con estos valores:

```env
# Auth.js — generar con: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
AUTH_SECRET=tu_secreto_aqui

# Google OAuth — ver sección "Configurar Google OAuth" abajo
AUTH_GOOGLE_ID=tu_client_id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=tu_client_secret

# URL base
NEXTAUTH_URL=http://localhost:3000

# DynamoDB Local (Docker) — no cambiar para desarrollo
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
TABLE_PREFIX=dev_
```

### 3. Levantar DynamoDB Local

```bash
npm run db:up        # DynamoDB en :8000 + UI admin en :8001
npm run db:setup     # Crea las 12 tablas y siembra el admin allowlist
```

> Inspector visual de tablas: http://localhost:8001

### 4. Arrancar la app

```bash
npm run dev          # http://localhost:3000
```

---

## Configurar Google OAuth

1. Ir a [console.cloud.google.com](https://console.cloud.google.com)
2. Crear un proyecto nuevo o seleccionar uno existente
3. Ir a **APIs y servicios → Credenciales**
4. Crear credencial → **ID de cliente OAuth 2.0** → Aplicación web
5. Agregar URI de redireccionamiento autorizado:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
6. Copiar el **Client ID** y **Client Secret** al `.env.local`

---

## Stack completo con Docker (escalamiento horizontal)

Para levantar la app completa con nginx y 3 instancias de Next.js:

```bash
# Primera vez — construir imágenes y levantar
docker compose up -d --build

# Veces siguientes
docker compose up -d

# Ver contenedores corriendo
docker ps

# Apagar todo
docker compose down
```

La app estará disponible en `http://localhost:80` balanceada entre 3 instancias.

> **Nota:** Antes de levantar el stack completo, asegúrate de haber corrido `npm run db:setup` con DynamoDB Local corriendo.

---

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servir el build |
| `npm run lint` | Lint con ESLint |
| `npm run typecheck` | Verificar tipos sin compilar |
| `npm run db:up` | Levantar DynamoDB Local en Docker |
| `npm run db:down` | Apagar el contenedor |
| `npm run db:setup` | Crear/verificar todas las tablas (idempotente) |
| `npm run db:reset` | Destruir todas las tablas (solo local) |

---

## Pruebas de carga con k6

Requiere el stack de Docker corriendo en `localhost:80`.

```bash
# Prueba de carga normal (50 usuarios, 5 min)
k6 run k6/01-load-test.js

# Prueba de estrés (hasta 500 usuarios, 12 min)
k6 run k6/02-stress-test.js

# Prueba de pico (0 → 200 usuarios en 30s)
k6 run k6/03-spike-test.js

# Guardar resultados en JSON
k6 run --out json=k6/results/load-test.json k6/01-load-test.js
```

Ver `k6/README.md` para más detalles.

---

## Arquitectura

```
nginx :80 (load balancer — least_conn)
  ├── app1 :3000 (Next.js)
  ├── app2 :3000 (Next.js)
  └── app3 :3000 (Next.js)
        └── DynamoDB Local :8000
```

**12 tablas DynamoDB:**
`Users`, `AdminAllowlist`, `Groups`, `GroupMembers`, `GroupRequests`,
`Matches`, `Predictions`, `Points`, `Notifications`, `ChatMessages`,
`Friendships`, `SpecialEvents`, `AuditLog`

---

## Roles

| Rol | Acceso |
|---|---|
| `PLAYER` | Dashboard, predicciones, grupos, amigos, ranking |
| `ADMIN` | Panel admin — partidos, usuarios, grupos, eventos, auditoría |

El rol se asigna automáticamente al hacer login: si el email está en la tabla `AdminAllowlist`, el usuario es `ADMIN`. Para agregar admins, insertar el email directamente en esa tabla via DynamoDB Admin (`localhost:8001`).

---

## Convenciones

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `test:`
- **Branches**: `feat/*`, `fix/*`, `chore/*` — mergeo a `main` vía PR
- **TypeScript**: modo estricto, evitar `any`
- **Repositories**: única capa que habla con DynamoDB — no hacer queries en components ni pages