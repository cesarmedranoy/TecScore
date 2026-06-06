/**
 * Generador de códigos de invitación humano-amigables.
 *
 * Formato: 8 chars con guión al medio para legibilidad → "ABCD-1234"
 *
 * Alfabeto: Crockford base32 sin chars ambiguos.
 *  - Omite I, L (parecen 1)
 *  - Omite O (parece 0)
 *  - Omite U (vulgar en español/inglés)
 *  - Solo mayúsculas para evitar el clásico "¿era una L o una I?"
 *
 * Entropía: 28 chars^8 ≈ 3.7×10^11 posibilidades. Con 1000 grupos activos
 * la probabilidad de colisión es despreciable; aún así el servicio reintenta
 * hasta 5 veces si pega justo.
 */

import { randomBytes } from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTVWXYZ23456789"; // 30 chars

export const JOIN_CODE_LENGTH = 8;

export function generateJoinCode(): string {
  const bytes = randomBytes(JOIN_CODE_LENGTH);
  let result = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    result += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  // Insertar guión a la mitad: "ABCD1234" → "ABCD-1234"
  return `${result.slice(0, 4)}-${result.slice(4)}`;
}

/** Normaliza input del usuario: quita espacios, guiones, lowercase, etc. */
export function normalizeJoinCode(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

/** ¿La cadena tiene forma de código válido? Útil para validación temprana. */
export function isValidJoinCodeFormat(input: string): boolean {
  const normalized = normalizeJoinCode(input);
  if (normalized.length !== JOIN_CODE_LENGTH) return false;
  for (const char of normalized) {
    if (!ALPHABET.includes(char)) return false;
  }
  return true;
}
