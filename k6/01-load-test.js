/**
 * TecScore — Prueba de carga normal (Load Test)
 *
 * Simula el tráfico esperado en un día normal del Mundial.
 * 50 usuarios concurrentes durante 5 minutos.
 *
 * Ejecutar: k6 run k6/01-load-test.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Métricas personalizadas
const errorRate    = new Rate("error_rate");
const pageLoadTime = new Trend("page_load_time", true);

export const options = {
  stages: [
    { duration: "1m", target: 20 },  // Ramp-up: 0 → 20 usuarios en 1 min
    { duration: "3m", target: 50 },  // Carga sostenida: 50 usuarios por 3 min
    { duration: "1m", target: 0  },  // Ramp-down: 50 → 0 en 1 min
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],  // 95% de requests < 2s
    http_req_failed:   ["rate<0.05"],   // menos del 5% de errores
    error_rate:        ["rate<0.05"],
  },
};

const BASE_URL = "http://localhost:80";

// Endpoints públicos que no requieren auth
const PUBLIC_ENDPOINTS = [
  "/",
  "/login",
];

// Endpoints que simulan uso autenticado (retornan 401 sin token — se mide latencia)
const AUTH_ENDPOINTS = [
  "/api/champion",
  "/api/users/search?q=test",
];

export default function () {
  // 1. Página de inicio
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    "landing page status 200 o 307": (r) => r.status === 200 || r.status === 307,
  });
  pageLoadTime.add(homeRes.timings.duration);
  errorRate.add(homeRes.status >= 500);
  sleep(1);

  // 2. Página de login
  const loginRes = http.get(`${BASE_URL}/login`);
  check(loginRes, {
    "login page ok": (r) => r.status === 200 || r.status === 307,
  });
  errorRate.add(loginRes.status >= 500);
  sleep(0.5);

  // 3. API endpoints (mide latencia aunque devuelvan 401)
  for (const endpoint of AUTH_ENDPOINTS) {
    const res = http.get(`${BASE_URL}${endpoint}`);
    check(res, {
      "api responde (no 500)": (r) => r.status !== 500 && r.status !== 503,
    });
    errorRate.add(res.status >= 500);
    pageLoadTime.add(res.timings.duration);
    sleep(0.3);
  }

  sleep(Math.random() * 2 + 1); // pausa realista entre acciones
}