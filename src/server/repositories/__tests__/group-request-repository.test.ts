/**
 * Tests de funciones puras del request-repository (la expiración).
 * El resto del repo requiere DynamoDB → integration tests en Fase 7.
 */

import { describe, it, expect } from "vitest";
import {
  isRequestExpired,
  REQUEST_TTL_HOURS,
} from "../group-request-repository";

describe("isRequestExpired", () => {
  it("retorna false si expiresAt es a futuro", () => {
    const expiresAt = new Date(Date.now() + 60_000).toISOString(); // +1 min
    expect(isRequestExpired({ expiresAt })).toBe(false);
  });

  it("retorna true si expiresAt ya pasó", () => {
    const expiresAt = new Date(Date.now() - 60_000).toISOString(); // -1 min
    expect(isRequestExpired({ expiresAt })).toBe(true);
  });

  it("retorna true exactamente al momento de expirar (borde)", () => {
    const atTime = new Date("2026-06-10T12:00:00Z");
    const expiresAt = "2026-06-10T12:00:00Z";
    expect(isRequestExpired({ expiresAt }, atTime)).toBe(true);
  });

  it(`la ventana TTL es de ${REQUEST_TTL_HOURS} horas`, () => {
    expect(REQUEST_TTL_HOURS).toBe(12);
  });
});
