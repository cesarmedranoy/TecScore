/**
 * TecScore — Prueba de pico (Spike Test)
 *
 * Simula un pico repentino de tráfico — como cuando empieza un partido
 * y todos los usuarios entran a la vez a predecir.
 *
 * Ejecutar: k6 run k6/03-spike-test.js
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate    = new Rate("error_rate");
const pageLoadTime = new Trend("page_load_time", true);

export const options = {
  stages: [
    { duration: "30s", target: 10  },  // Tráfico base
    { duration: "30s", target: 200 },  // Pico repentino (inicio del partido)
    { duration: "1m",  target: 200 },  // Mantener el pico
    { duration: "30s", target: 10  },  // Caída rápida
    { duration: "30s", target: 0   },  // Fin
  ],
  thresholds: {
    http_req_duration: ["p(95)<8000"],  // más tolerante durante picos
    http_req_failed:   ["rate<0.20"],
  },
};

const BASE_URL = "http://localhost:80";

export default function () {
  // Simular el flujo típico al inicio de un partido
  const flows = [
    () => http.get(`${BASE_URL}/`),
    () => http.get(`${BASE_URL}/login`),
    () => http.get(`${BASE_URL}/api/champion`),
  ];

  // Cada VU ejecuta un flujo aleatorio
  const flow = flows[Math.floor(Math.random() * flows.length)];
  const res = flow();

  check(res, {
    "sistema responde bajo pico": (r) => r.status !== 500 && r.status !== 503,
  });

  errorRate.add(res.status >= 500);
  pageLoadTime.add(res.timings.duration);

  sleep(Math.random() * 0.5);
}