/**
 * Panel admin — MVP funcional.
 *
 * Solo accesible si session.user.role === "ADMIN" (verificado por proxy
 * Y por este server component como doble defensa).
 *
 * El CRUD real (gestión de grupos, usuarios, partidos, auditoría) se
 * implementa en la Fase 5.
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/layout/sign-out-button";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Defense in depth: el proxy ya filtró, pero re-chequeamos por si acaso
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const { name, email } = session.user;
  const displayName = name ?? "Admin";

  return (
    <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-12">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-red-600 dark:text-red-400">
            Panel de administrador
          </span>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            {displayName}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{email}</p>
        </div>
        <SignOutButton />
      </div>

      <div className="rounded-2xl border border-red-200 dark:border-red-900/40 p-8 bg-red-50/50 dark:bg-red-950/20">
        <h2 className="text-lg font-semibold mb-2">
          Acceso admin confirmado ✅
        </h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          Tu email está en la <code>AdminAllowlist</code> de DynamoDB, por eso
          ves este panel. La Fase 5 implementará: gestión de partidos, CRUD de
          grupos y usuarios, manejo de resultados con cálculo automático de
          puntos, auditoría completa, y dashboard de métricas globales.
        </p>
      </div>
    </main>
  );
}
