/**
 * Utilidades generales reutilizadas en toda la app.
 *
 * Cada función pura aquí debe tener un único propósito claro.
 * Si una función crece más de 30 líneas, probablemente debe ir a su propio módulo.
 */

import { ulid } from "ulid";

/**
 * Genera un ID ordenable cronológicamente.
 *
 * Por qué ULID y no UUID:
 *  - ULID = 26 chars, lexicográficamente ordenable por timestamp
 *  - En DynamoDB, un sort key ULID nos da "los items más recientes" sin GSI extra
 *  - Compatible con UUID en longitud y unicidad
 *
 * Ejemplo: `01HQX5R3M4Y8K6E0Z9P2N7QABC` (los primeros 10 chars son timestamp)
 */
export function newId(): string {
  return ulid();
}

/**
 * Timestamp ISO 8601 actual. Lo aislamos en función para poder mockear en tests.
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * cn (className): merge condicional de clases Tailwind.
 *
 * Lo necesita shadcn/ui. Implementación mínima sin dependencias extras.
 * Si más adelante usamos `clsx` + `tailwind-merge` para manejar conflictos
 * (ej. dos `p-4` en la misma cadena), lo reemplazamos aquí sin tocar el resto.
 */
export function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(" ");
}
