/**
 * Tests del generador de código de invitación.
 */

import { describe, it, expect } from "vitest";
import {
  generateJoinCode,
  normalizeJoinCode,
  isValidJoinCodeFormat,
  JOIN_CODE_LENGTH,
} from "../join-code";

describe("generateJoinCode", () => {
  it(`devuelve un código de ${JOIN_CODE_LENGTH} chars + guión al medio`, () => {
    const code = generateJoinCode();
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  it("nunca contiene caracteres ambiguos I L O U 0 1", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateJoinCode();
      expect(code).not.toMatch(/[ILOU01]/);
    }
  });

  it("códigos consecutivos son distintos (entropía suficiente)", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      codes.add(generateJoinCode());
    }
    expect(codes.size).toBe(1000);
  });
});

describe("normalizeJoinCode", () => {
  it("quita guiones y espacios y pasa a mayúsculas", () => {
    expect(normalizeJoinCode("abcd-1234")).toBe("ABCD1234");
    expect(normalizeJoinCode("AB CD 12 34")).toBe("ABCD1234");
    expect(normalizeJoinCode(" ABCD-1234 ")).toBe("ABCD1234");
  });
});

describe("isValidJoinCodeFormat", () => {
  it("acepta códigos generados", () => {
    for (let i = 0; i < 50; i++) {
      expect(isValidJoinCodeFormat(generateJoinCode())).toBe(true);
    }
  });

  it("acepta input con o sin guión", () => {
    expect(isValidJoinCodeFormat("ABCD-2345")).toBe(true);
    expect(isValidJoinCodeFormat("ABCD2345")).toBe(true);
    expect(isValidJoinCodeFormat("abcd-2345")).toBe(true);
  });

  it("rechaza códigos con chars ambiguos", () => {
    expect(isValidJoinCodeFormat("ILOL1234")).toBe(false);
    expect(isValidJoinCodeFormat("ABCD-0123")).toBe(false); // 0 y 1 no permitidos
  });

  it("rechaza longitudes incorrectas", () => {
    expect(isValidJoinCodeFormat("ABC")).toBe(false);
    expect(isValidJoinCodeFormat("ABCDEFGHIJK")).toBe(false);
  });
});
