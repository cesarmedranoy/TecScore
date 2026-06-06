/**
 * Handler de Auth.js para todas las rutas /api/auth/*.
 * Auth.js maneja internamente: sign-in, callback, sign-out, session, etc.
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
