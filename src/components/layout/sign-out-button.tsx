/**
 * Botón de sign-out. Usa server action para invalidar la sesión.
 *
 * Server actions con `"use server"` son la forma idiomática de Auth.js v5
 * para mutaciones de sesión (evita exponer endpoints REST al cliente).
 */

import { LogOut } from "lucide-react";
import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        className="w-full justify-start text-muted-foreground hover:text-danger"
      >
        <LogOut />
        Cerrar sesión
      </Button>
    </form>
  );
}
