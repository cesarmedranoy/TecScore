/**
 * TecScore — Prueba de estrés (Stress Test)
 *
 * Aumenta la carga progresivamente hasta encontrar el punto de quiebre.
 * Identifica cuántos usuarios concurrentes puede manejar el sistema.
 *
 * Ejecutar: k6 run k6/02-stress-test.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

const errorRate    = new Rate("error_rate");
const pageLoadTime = new Trend("page_load_time", true);
const failedReqs   = new Counter("failed_requests");

export const options = {
  stages: [
    { duration: "2m", target: 50  },  // Carga normal
    { duration: "2m", target: 100 },  // Carga alta
    { duration: "2m", target: 200 },  // Estrés
    { duration: "2m", target: 300 },  // Estrés extremo
    { duration: "2m", target: 500 },
    { duration: "2m", target: 0   },  // Recuperación
  ],
  thresholds: {
    http_req_duration: ["p(95)<8000"],  // 95% < 5s bajo estrés
    http_req_failed:   ["rate<0.15"],   // menos del 15% de errores
  },
};

const BASE_URL = "http://localhost:80";

export default function () {
  // Simular navegación de usuario
  const endpoints = [
    "/",
    "/login",
    "/api/champion",
    "/api/users/search?q=arnold",
  ];

  for (const endpoint of endpoints) {
    const res = http.get(`${BASE_URL}${endpoint}`, {
      timeout: "10s",
    });

    const ok = check(res, {
      "status no es 500/503": (r) => r.status !== 500 && r.status !== 503,
      "responde en menos de 5s": (r) => r.timings.duration < 5000,
    });

    if (!ok) failedReqs.add(1);
    errorRate.add(res.status >= 500);
    pageLoadTime.add(res.timings.duration);
    sleep(0.2);
  }

  sleep(1);
}