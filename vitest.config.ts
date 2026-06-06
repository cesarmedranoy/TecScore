/**
 * Config de Vitest.
 *
 * Reglas:
 *  - Solo testeamos código puro (lib/scoring, lib/utils, etc.)
 *  - Los repositories NO se testean acá porque tocan DynamoDB.
 *    Esos van en integration tests separados (Fase 7).
 */

import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/__tests__/**/*.ts"],
    exclude: ["node_modules", ".next", "dist"],
  },
});
