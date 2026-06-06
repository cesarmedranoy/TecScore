/**
 * Extensión de tipos de Auth.js para incluir nuestros campos custom
 * (userId, tag, role) en la session y el JWT.
 *
 * Hay que augmentar AMBOS módulos:
 *   - next-auth (Session)
 *   - @auth/core/jwt (JWT subyacente, que es lo que reciben los callbacks)
 *
 * Sin esto, TypeScript marcaría `token.userId` como `{}` y `session.user.role`
 * como `any`.
 */

import type { DefaultSession } from "next-auth";
import type { Role } from "@/types";

declare module "next-auth" {
  interface Session {
    user: {
      userId: string;
      tag: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    tag?: string;
    role?: Role;
  }
}
