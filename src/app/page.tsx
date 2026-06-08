/**
 * Landing público de TecScore.
 *
 * Si el usuario YA está logueado, lo mandamos directamente a su área.
 * Si no, mostramos el hero con CTA "Comenzar".
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
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col relative overflow-hidden">

      {/* ── Fondo: líneas de cancha ── */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 780 580" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <rect x="60" y="40" width="660" height="500" fill="none" stroke="white" strokeWidth="1.5"/>
          <line x1="390" y1="40" x2="390" y2="540" stroke="white" strokeWidth="1"/>
          <circle cx="390" cy="290" r="80" fill="none" stroke="white" strokeWidth="1"/>
          <circle cx="390" cy="290" r="4" fill="white"/>
          <rect x="60" y="160" width="130" height="180" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="590" y="160" width="130" height="180" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="60" y="200" width="60" height="100" fill="none" stroke="white" strokeWidth="1"/>
          <rect x="660" y="200" width="60" height="100" fill="none" stroke="white" strokeWidth="1"/>
          <path d="M 190 160 Q 200 290 190 420" fill="none" stroke="white" strokeWidth="0.8"/>
          <path d="M 590 160 Q 580 290 590 420" fill="none" stroke="white" strokeWidth="0.8"/>
        </svg>
      </div>

      {/* ── Glow verde central ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(16,185,89,0.12) 0%, transparent 65%)" }}
      />

      {/* ── Navbar ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#10b959] rounded-lg flex items-center justify-center font-black text-white text-base select-none">
            T
          </div>
          <span className="text-white text-lg font-black tracking-tight">TecScore</span>
        </div>
        <Link
          href="/login"
          className="flex items-center gap-1.5 bg-white/[0.07] border border-white/[0.12] text-white/80 text-sm font-medium px-5 py-2 rounded-full hover:bg-white/10 transition-colors"
        >
          Iniciar sesión →
        </Link>
      </nav>

      {/* ── Hero ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#10b959]/10 border border-[#10b959]/30 text-green-400 text-[11px] font-bold uppercase tracking-[1.5px] px-4 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" aria-hidden="true" />
          Mundial 2026 · En vivo pronto
        </div>

        {/* Título */}
        <h1 className="text-[clamp(52px,9vw,80px)] font-black text-white leading-[.95] tracking-[-3px] mb-5">
          El juego<br />dentro<br />
          <span className="text-[#10b959]">del juego.</span>
        </h1>

        {/* Subtítulo */}
        <p className="text-white/50 text-base sm:text-lg leading-relaxed max-w-lg mb-9">
          Predice los partidos del Mundial, gana puntos por acertar y compite con
          tus amigos en salas privadas. Totalmente gratis.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-3 mb-10">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[#10b959] hover:bg-[#0ea84f] text-white text-[15px] font-bold px-8 py-3.5 rounded-full transition-colors"
          >
            Comenzar gratis
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {[
            { icon: "⚽", text: "104 partidos para predecir" },
            { icon: "🏆", text: "Ranking global en tiempo real" },
            { icon: "🔒", text: "Grupos privados con amigos"   },
            { icon: "🎯", text: "Sin dinero real, puro skill"  },
          ].map((f) => (
            <div
              key={f.text}
              className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-full px-4 py-1.5 text-[12px] text-white/55 font-medium"
            >
              <span aria-hidden="true">{f.icon}</span>
              {f.text}
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-8 bg-white/[0.03] border border-white/[0.07] rounded-2xl px-8 py-4">
          {[
            { num: "104", label: "Partidos"     },
            { num: "48",  label: "Selecciones"  },
            { num: "5",   label: "Grupos máx."  },
            { num: "0 pts", label: "Para empezar" },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex items-center gap-8">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[26px] font-black text-white tracking-tight leading-none">
                  {s.num}
                </span>
                <span className="text-[10px] text-white/35 uppercase tracking-widest">
                  {s.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <div className="w-px h-8 bg-white/[0.08]" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer mínimo ── */}
      <footer className="relative z-10 text-center pb-5 text-[11px] text-white/20 tracking-wide">
        Login con Google · Es gratis
      </footer>
    </main>
  );
}