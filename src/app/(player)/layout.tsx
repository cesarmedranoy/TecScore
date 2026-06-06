/**
 * Layout del área de jugador.
 *
 * Estructura:
 *   [Sidebar fija | Contenedor principal]
 *                  ├── PlayerHeader (sticky)
 *                  └── children (la página actual)
 *
 * Server Component que lee la sesión y se la pasa al header.
 * Si no hay sesión, redirige a /login (proxy ya hace esto pero
 * defense-in-depth nunca está de más).
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { userRepository } from "@/server/repositories";
import { PlayerSidebar } from "@/components/layout/player-sidebar";
import { PlayerHeader } from "@/components/layout/player-header";
import { SignOutButton } from "@/components/layout/sign-out-button";

export default async function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  // Traemos al usuario completo de DynamoDB para tener points + streak
  // (en el JWT solo tenemos role/tag/userId — los puntos cambian).
  const user = await userRepository.getById(session.user.userId);

  const name = user?.displayName ?? session.user.name ?? "Jugador";
  const tag = user?.tag ?? session.user.tag;
  const avatarUrl = user?.avatarUrl ?? session.user.image ?? undefined;
  const points = user?.totalPoints ?? 0;
  const streak = user?.currentStreak ?? 0;

  return (
    <div className="flex min-h-screen flex-1">
      <PlayerSidebar signOutSlot={<SignOutButton />} />
      <div className="flex-1 flex flex-col min-w-0">
        <PlayerHeader
          name={name}
          tag={tag}
          avatarUrl={avatarUrl}
          points={points}
          streak={streak}
        />
        <main className="flex-1 px-6 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
