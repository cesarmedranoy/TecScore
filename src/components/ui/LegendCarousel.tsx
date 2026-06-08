"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

const LEGENDS = [
  {
    name: "Cristiano Ronaldo",
    country: "🇵🇹 Portugal · CR7",
    number: "7",
    quote: "Los trofeos no te buscan a ti, eres tú quien los busca.",
    accent: "rgba(16,185,89,0.18)",
    image: "/legends/ronaldo.png",
  },
  {
    name: "Lionel Messi",
    country: "🇦🇷 Argentina · La Pulga",
    number: "10",
    quote: "Hay que trabajar mucho para lograr algo.",
    accent: "rgba(59,130,246,0.18)",
    image: "/legends/messi.png",
  },
  {
    name: "Ronaldinho",
    country: "🇧🇷 Brasil · El Mago",
    number: "10",
    quote: "Juega con alegría. Eso es todo lo que necesitas.",
    accent: "rgba(250,204,21,0.18)",
    image: "/legends/ronaldinho.png",
  },
  {
    name: "Diego Maradona",
    country: "🇦🇷 Argentina · El Pibe",
    number: "10",
    quote: "El fútbol es el deporte más hermoso del mundo.",
    accent: "rgba(14,165,233,0.18)",
    image: "/legends/maradona.png",
  },
  {
    name: "Pelé",
    country: "🇧🇷 Brasil · O Rei",
    number: "10",
    quote: "El éxito no es accidente. Es trabajo duro y aprendizaje.",
    accent: "rgba(245,158,11,0.18)",
    image: "/legends/pele.png",
  },
];

export function LegendCarousel() {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      goTo((current + 1) % LEGENDS.length);
    }, 4500);
    return () => clearInterval(t);
  }, [current]);

  function goTo(n: number) {
    if (n === current) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(n);
      setTransitioning(false);
    }, 350);
  }

  const leg = LEGENDS[current];

  return (
    <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#0d1a12]">

      {/* Líneas de cancha */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
        viewBox="0 0 340 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <rect x="20" y="60" width="300" height="480" fill="none" stroke="white" strokeWidth="1" />
        <circle cx="170" cy="300" r="70" fill="none" stroke="white" strokeWidth="1" />
        <circle cx="170" cy="300" r="3" fill="white" />
        <rect x="70" y="180" width="200" height="130" fill="none" stroke="white" strokeWidth="1" />
        <line x1="20" y1="300" x2="320" y2="300" stroke="white" strokeWidth="1" />
      </svg>

      {/* Gradiente inferior — integra el jugador al fondo */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/10 to-transparent pointer-events-none z-10" />

      {/* Gradiente lateral izquierdo */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0a0a0a] to-transparent pointer-events-none z-10" />

      {/* Overlay de color por jugador */}
      <div
        className="absolute inset-0 pointer-events-none z-10 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${leg.accent} 0%, transparent 60%)`,
        }}
      />

      {/* Badge superior */}
      <div className="absolute top-5 left-5 z-20 flex items-center gap-1.5 bg-black/50 border border-white/10 rounded-full px-3 py-1.5">
        <span className="text-yellow-400 text-[10px]" aria-hidden="true">★</span>
        <span className="text-white/60 text-[11px] font-medium tracking-wide">
          Leyendas del fútbol
        </span>
      </div>

      {/* Número gigante de fondo */}
      <div
        className="absolute right-4 z-10 font-black text-white leading-none select-none transition-all duration-500"
        style={{
          fontSize: "clamp(120px, 22vw, 200px)",
          opacity: transitioning ? 0 : 0.05,
          bottom: "60px",
        }}
        aria-hidden="true"
      >
        {leg.number}
      </div>

      {/* ── Imagen del jugador — ocupa casi todo el panel ── */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 pointer-events-none transition-all duration-350"
        style={{
          top: "20%",
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "translateY(16px)" : "translateY(0px)",
          // Desvanece suavemente solo los últimos píxeles del pie
          WebkitMaskImage: "linear-gradient(to top, transparent 0%, black 12%, black 100%)",
          maskImage: "linear-gradient(to top, transparent 0%, black 12%, black 100%)",
        }}
      >
        <Image
          src={leg.image}
          alt={leg.name}
          fill
          className="object-contain object-bottom"
          priority
          sizes="(max-width: 1024px) 0px, 50vw"
        />
      </div>

      {/* Info del jugador — abajo a la derecha */}
      <div
        className="absolute bottom-12 right-6 z-30 text-right transition-all duration-350 pointer-events-none"
        style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "translateY(10px)" : "translateY(0)",
        }}
      >
        <h2 className="text-3xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
          {leg.name}
        </h2>
        <p className="text-white/50 text-[11px] uppercase tracking-widest font-semibold mt-1">
          {leg.country}
        </p>
        <p className="text-white/60 text-sm italic mt-3 max-w-[220px] leading-snug drop-shadow">
          &ldquo;{leg.quote}&rdquo;
        </p>
      </div>

      {/* Puntos de navegación */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
        {LEGENDS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Ver ${LEGENDS[i].name}`}
            className="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
            style={{
              width: i === current ? "18px" : "6px",
              background: i === current ? "#10b959" : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>
    </div>
  );
}