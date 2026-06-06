/**
 * Proxy (antes "middleware" en Next ≤15) — primer filtro de cada request.
 *
 * Next.js 16 renombró middleware → proxy y ahora corre en Node runtime.
 * Igual seguimos la guía de auth: NO hacer queries pesadas aquí.
 * Solo lectura del JWT y redirects rápidos. La verdadera autorización
 * va en cada page server-side.
 */

import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: proxy } = NextAuth(authConfig);

export default proxy;

export const config = {
  // Excluye rutas estáticas y endpoints API de auth (Auth.js los maneja solo)
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
