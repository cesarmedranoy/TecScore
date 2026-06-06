# 06 — Stress tests con k6

## Qué hay que hacer

Crear un script de k6 que simule **5000 requests por hora** (objetivo del
proyecto) contra los endpoints más críticos, correrlo, y documentar los
resultados.

## Por qué es importante

Está EXPLÍCITAMENTE en la rúbrica del profesor:
> "Documentación de las pruebas realizadas (incluyendo pruebas de estrés /
> stress testing)"

Es la entrega que más fácil te suma puntos con la calificación.

## Stack

k6 — herramienta gratuita de Grafana para load testing. Sintaxis JS familiar.

Instalación (Windows con Chocolatey):
```bash
choco install k6
```

O descargá el binario directo: <https://k6.io/docs/getting-started/installation/>

## Estructura sugerida

```
partner-tasks/06-stress-tests-k6/
├── README.md                 (este archivo)
├── results.md                (los resultados que vas a documentar)
├── scripts/
│   ├── 01-login-flow.js
│   ├── 02-create-prediction.js
│   ├── 03-mark-result-scoring.js  ← el más crítico (pico de carga)
│   └── all-endpoints.js
└── (capturas del dashboard de k6)
```

## Script base

`scripts/03-mark-result-scoring.js`:

```js
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 50 },   // ramp up
    { duration: "2m", target: 100 },   // sustained
    { duration: "30s", target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],   // <1% errores
    http_req_duration: ["p(95)<500"], // 95% de requests <500ms
  },
};

export default function () {
  // Simular un GET al dashboard (público al hacer prefetch)
  const res = http.get("http://localhost:3000/api/groups");

  check(res, {
    "status 200 o 401 (sin auth)": (r) => r.status === 200 || r.status === 401,
    "response time < 1s": (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
```

## Cálculos importantes

5000 req/h = 5000 / 3600 ≈ **1.39 req/s sostenido**

Pero el pico real es cuando el admin marca un resultado: TODOS los usuarios
con predicción en ese partido reciben puntos en simultáneo. Con 1000 usuarios
activos, eso podrían ser 1000 ops a DynamoDB en milisegundos. **Ese es el
escenario que más interesa probar.**

## Pasos

### 1. Levantá la app local

```bash
npm run db:up
npm run db:setup
npm run dev
```

### 2. (Opcional) Seedeá data de prueba

Crear `scripts/seed-stress-test.ts` con:
- 100 usuarios fake
- 10 partidos
- 100 predicciones por partido

Si Julio no lo hizo, podés pedirle ayuda — es 30 minutos de scripting con los
repositories existentes.

### 3. Correr los tests

```bash
k6 run partner-tasks/06-stress-tests-k6/scripts/03-mark-result-scoring.js
```

### 4. Documentar resultados

En `results.md`, incluí:
- Tu hardware (CPU, RAM)
- Versión de Node, Docker
- Comando exacto que corriste
- Captura del output de k6 (métricas)
- Análisis: ¿soportó 5000 req/h? ¿Hubo errores? ¿Latencia P95?
- Conclusiones: cuellos de botella detectados, sugerencias de optimización

## Acceptance criteria

- [ ] Al menos 3 scripts cubriendo: login flow, prediction submit, scoring
      trigger
- [ ] Documento `results.md` con métricas y análisis
- [ ] Capturas del output
- [ ] Conclusión clara: ¿pasamos el objetivo de 5000 req/h?

## Esfuerzo

4-5 horas (1h aprender k6, 2h escribir scripts, 2h documentar).

## Recursos

- https://k6.io/docs/
- https://k6.io/docs/test-types/load-testing/
