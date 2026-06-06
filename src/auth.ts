/**
 * Config completa de Auth.js — incluye callbacks que tocan DynamoDB.
 *
 * Se usa en:
 *  - El handler API (/api/auth/[...nextauth])
 *  - Cualquier server component que llame a `auth()`
 *
 * NO se usa en el proxy (proxy importa auth.config.ts directo).
 */

import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { isAdminEmail } from "@/lib/auth/allowlist";
import { upsertUserFromGoogle } from "@/lib/auth/users";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,

    /**
     * Filtro temprano: permitir o bloquear el sign-in.
     * Si retorna false o lanza, Auth.js cancela el flujo.
     */
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return false;
      // Google envía email_verified; rechazamos si no lo verificó
      if (profile && profile.email_verified === false) return false;
      return true;
    },

    /**
     * jwt() se invoca cuando se crea o actualiza el JWT.
     *  - En primer login: `account` y `profile` están presentes
     *  - En requests posteriores: solo `token`
     *
     * Aprovechamos el primer login para upsert + lookup admin allowlist.
     * Esto evita tocar DynamoDB en cada request (el JWT mantiene el rol).
     */
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        const isAdmin = await isAdminEmail(profile.email);
        const user = await upsertUserFromGoogle({
          email: profile.email,
          googleId: (profile.sub as string) ?? "",
          displayName: (profile.name as string) ?? "Jugador",
          avatarUrl: (profile.picture as string) ?? "",
          role: isAdmin ? "ADMIN" : "PLAYER",
        });
        token.userId = user.userId;
        token.tag = user.tag;
        token.role = user.role;
      }
      return token;
    },
  },
});
