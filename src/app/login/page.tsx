/**
 * Página de login — TecScore
 *
 * Usa server actions de Auth.js v5: el botón dispara `signIn("google")`
 * desde el servidor. El LegendCarousel es un Client Component separado
 * que no afecta el flujo de auth.
 */

import { signIn } from "@/auth";
import { LegendCarousel } from "@/components/ui/LegendCarousel";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex">

      {/* ── Líneas de cancha — fondo decorativo ── */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 680 600"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect x="340" y="0" width="340" height="600" fill="none" stroke="white" strokeWidth="1" />
          <rect x="370" y="120" width="280" height="360" fill="none" stroke="white" strokeWidth="0.8" />
          <circle cx="510" cy="300" r="80" fill="none" stroke="white" strokeWidth="0.8" />
          <circle cx="510" cy="300" r="4" fill="white" />
          <line x1="340" y1="0" x2="340" y2="600" stroke="white" strokeWidth="1.2" />
        </svg>
      </div>

      {/* ── Panel izquierdo — login ── */}
      <div className="relative z-10 flex flex-col justify-center w-full lg:max-w-[520px] px-10 py-12">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-9 h-9 bg-[#10b959] rounded-lg flex items-center justify-center font-black text-white text-lg select-none">
            T
          </div>
          <span className="text-white text-2xl font-black tracking-tight">TecScore</span>
        </div>

        {/* Badge Mundial */}
        <div className="inline-flex items-center gap-2 bg-[#10b959]/10 border border-[#10b959]/30 text-green-400 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full w-fit mb-5">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />
          Mundial 2026
        </div>

        {/* Titular */}
        <h1 className="text-5xl font-black text-white leading-[1.05] tracking-tight mb-4">
          Predice.<br />
          Compite.<br />
          <span className="text-[#10b959]">Domina.</span>
        </h1>

        <p className="text-white/50 text-[15px] leading-relaxed mb-10 max-w-sm">
          Apuesta con puntos, sube en el ranking y demuestra que sabes más de fútbol que tus amigos.
        </p>

        {/* Stats rápidos */}
        <div className="flex items-center gap-6 mb-10">
          {[
            { num: "104",    label: "Partidos"     },
            { num: "5",     label: "Grupos máx."  },
            { num: "0 pts", label: "Para empezar" },
          ].map((s, i) => (
            <div key={i} className="flex flex-col">
              <span className="text-white text-2xl font-black tracking-tight">{s.num}</span>
              <span className="text-white/40 text-[11px] uppercase tracking-wide">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Card de login ── */}
        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7 max-w-sm w-full">
          <p className="text-white font-semibold text-base mb-1">Entrar a TecScore</p>
          <p className="text-white/40 text-sm mb-5">Solo cuentas @tecsup.edu.pe</p>

          {/* Server Action — no expone lógica al cliente */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-white hover:bg-gray-100 active:bg-gray-200 transition-colors rounded-xl font-semibold text-sm text-[#111] mb-4"
            >
              {/* Logo de Google — SVG inline para evitar un fetch extra */}
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuar con Google
            </button>
          </form>

          <p className="text-[11px] text-white/25 text-center mt-4 leading-relaxed">
            Al continuar aceptas crear una cuenta en TecScore.<br />
          </p>
        </div>
      </div>

      {/* ── Panel derecho — carrusel de leyendas ── */}
      <LegendCarousel />

    </main>
  );
}