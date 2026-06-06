/**
 * Botón de sign-out. Usa server action para invalidar la sesión.
 *
 * Server actions con `"use server"` son la forma idiomática de Auth.js v5
 * para mutaciones de sesión (evita exponer endpoints REST al cliente).
 */

import { signOut } from "@/auth";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="px-4 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-zinc-700 dark:text-zinc-300"
      >
        Cerrar sesión
      </button>
    </form>
  );
}
