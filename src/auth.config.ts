/**
 * Config compartida de Auth.js — SIN llamadas a DynamoDB.
 *
 * Por qué dos archivos (auth.config.ts + auth.ts):
 *  - El proxy (antes "middleware") corre en cada request. Si importara DynamoDB
 *    sumaría peso al bundle y latencia. Usa SOLO este archivo.
 *  - El handler de auth (callbacks que necesitan DB) usa auth.ts, que extiende
 *    esta config con la lógica pesada.
 *
 * Este patrón es el oficial recomendado por Auth.js v5.
 */

import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    /**
     * session() inyecta los campos custom del JWT en el objeto session.
     *
     * VIVE EN auth.config.ts (no en auth.ts) porque el proxy también necesita
     * leer `role` para autorizar rutas. Es pure JS, no toca DynamoDB.
     */
    async session({ session, token }) {
      if (token.userId) session.user.userId = token.userId;
      if (token.tag) session.user.tag = token.tag;
      if (token.role) session.user.role = token.role;
      return session;
    },

    /**
     * Se ejecuta en cada request gracias al proxy.
     * Es el "primer filtro" — chequeos rápidos basados en cookie/JWT.
     * NO toca DynamoDB.
     */
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user;
      const isLoggedIn = !!user;
      const path = nextUrl.pathname;

      const isOnLogin = path === "/login";
      const isOnAdmin = path.startsWith("/admin");
      const isOnPlayerArea =
        path.startsWith("/dashboard") ||
        path.startsWith("/mis-apuestas") ||
        path.startsWith("/mis-grupos") ||
        path.startsWith("/amigos") ||
        path.startsWith("/buscar") ||
        path.startsWith("/perfil");

      // Si ya está logueado y entra a /login, lo mandamos a su área
      if (isOnLogin && isLoggedIn) {
        const dest = user.role === "ADMIN" ? "/admin" : "/dashboard";
        return Response.redirect(new URL(dest, nextUrl));
      }

      // Admin area: requiere login + rol ADMIN
      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        return user.role === "ADMIN";
      }

      // Player area: requiere login
      if (isOnPlayerArea) {
        return isLoggedIn;
      }

      // Resto = público (landing, /login, /api/auth/*)
      return true;
    },
  },
} satisfies NextAuthConfig;
