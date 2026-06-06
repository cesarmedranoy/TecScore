/**
 * Landing público de TecScore.
 *
 * Si el usuario YA está logueado, lo mandamos directamente a su área.
 * Si no, mostramos el hero con CTA "Comenzar".
 *
 * Esta página es un MVP funcional — el diseño final (carousel 3D Webflow-style,
 * gamificación visual, etc.) se implementa en la Fase 5.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/dashboard");
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-black dark:to-zinc-900">
      <div className="max-w-2xl flex flex-col items-center text-center gap-8">
        <span className="px-4 py-1.5 text-xs font-semibold tracking-wider uppercase rounded-full bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
          Mundial 2026
        </span>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          TecScore
        </h1>
        <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Predice los partidos, gana puntos por acertar, compite con tus amigos en
          salas privadas y subí en el ranking global.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-zinc-900 text-zinc-50 font-medium hover:bg-zinc-800 transition-colors dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Comenzar →
        </Link>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Login con Google. Es gratis.
        </p>
      </div>
    </main>
  );
}
