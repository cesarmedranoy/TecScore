/**
 * Dashboard del jugador — MVP funcional para verificar el flujo de auth.
 *
 * La UI gamificada completa (3D carousel, secciones del dashboard, ranking,
 * widgets de apuestas, etc.) se implementa en la Fase 5.
 *
 * Esta página existe ahora solo para:
 *  - Confirmar que el login con Google funciona
 *  - Mostrar los datos persistidos del usuario en DynamoDB
 *  - Verificar que el rol es PLAYER
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/layout/sign-out-button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Si por alguna razón un ADMIN entra acá, lo mandamos a su panel
  if (session.user.role === "ADMIN") redirect("/admin");

  const { name, tag, email, image, userId, role } = session.user;
  const displayName = name ?? "Jugador";

  return (
    <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          {image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={displayName ?? "Avatar"}
              className="w-14 h-14 rounded-full border-2 border-zinc-200 dark:border-zinc-700"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {displayName}
              <span className="text-zinc-400 dark:text-zinc-500">#{tag}</span>
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{email}</p>
          </div>
        </div>
        <SignOutButton />
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 bg-white dark:bg-zinc-950">
        <h2 className="text-lg font-semibold mb-2">¡Bienvenido, {displayName}!</h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          La Fase 2 (auth) está funcionando. Tu cuenta está guardada en DynamoDB
          con rol <strong>{role}</strong>. Las próximas fases agregarán
          predicciones, grupos, ranking y el dashboard gamificado real.
        </p>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">User ID</dt>
            <dd className="font-mono text-xs text-zinc-900 dark:text-zinc-100 break-all">
              {userId}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Tag</dt>
            <dd className="font-mono text-zinc-900 dark:text-zinc-100">
              #{tag}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Rol</dt>
            <dd className="text-zinc-900 dark:text-zinc-100">{role}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
            <dd className="text-zinc-900 dark:text-zinc-100">{email}</dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
