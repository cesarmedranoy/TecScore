/**
 * ChampionPicker — UI para que el jugador elija el campeón del Mundial.
 *
 * Guarda en: src/components/gamified/ChampionPicker.tsx
 */

"use client";

import { useState, useEffect, useTransition } from "react";
import { Trophy, Lock, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpecialEvent } from "@/types";

// 48 selecciones clasificadas al Mundial 2026
const TEAMS = [
  "Alemania", "Arabia Saudí", "Argelia", "Argentina", "Australia",
  "Austria", "Bélgica", "Bosnia y Herzegovina", "Brasil", "Canadá",
  "Catar", "Chequia", "Colombia", "Costa de Marfil", "Croacia",
  "Curazao", "Ecuador", "Egipto", "Escocia", "España",
  "Estados Unidos", "Francia", "Ghana", "Haití", "Inglaterra",
  "Irak", "Islas de Cabo Verde", "Japón", "Jordania", "Marruecos",
  "México", "Noruega", "Nueva Zelanda", "Países Bajos", "Panamá",
  "Paraguay", "Portugal", "RD Congo", "República de Corea", "RI de Irán",
  "Senegal", "Sudáfrica", "Suecia", "Suiza", "Túnez",
  "Turquía", "Uruguay", "Uzbekistán",
].sort();

const FLAGS: Record<string, string> = {
  "Alemania": "🇩🇪", "Arabia Saudí": "🇸🇦", "Argelia": "🇩🇿",
  "Argentina": "🇦🇷", "Australia": "🇦🇺", "Austria": "🇦🇹",
  "Bélgica": "🇧🇪", "Bosnia y Herzegovina": "🇧🇦", "Brasil": "🇧🇷",
  "Canadá": "🇨🇦", "Catar": "🇶🇦", "Chequia": "🇨🇿",
  "Colombia": "🇨🇴", "Costa de Marfil": "🇨🇮", "Croacia": "🇭🇷",
  "Curazao": "🇨🇼", "Ecuador": "🇪🇨", "Egipto": "🇪🇬",
  "Escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "España": "🇪🇸", "Estados Unidos": "🇺🇸",
  "Francia": "🇫🇷", "Ghana": "🇬🇭", "Haití": "🇭🇹",
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Irak": "🇮🇶", "Islas de Cabo Verde": "🇨🇻",
  "Japón": "🇯🇵", "Jordania": "🇯🇴", "Marruecos": "🇲🇦",
  "México": "🇲🇽", "Noruega": "🇳🇴", "Nueva Zelanda": "🇳🇿",
  "Países Bajos": "🇳🇱", "Panamá": "🇵🇦", "Paraguay": "🇵🇾",
  "Portugal": "🇵🇹", "RD Congo": "🇨🇩", "República de Corea": "🇰🇷",
  "RI de Irán": "🇮🇷", "Senegal": "🇸🇳", "Sudáfrica": "🇿🇦",
  "Suecia": "🇸🇪", "Suiza": "🇨🇭", "Túnez": "🇹🇳",
  "Turquía": "🇹🇷", "Uruguay": "🇺🇾", "Uzbekistán": "🇺🇿",
};

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(closesAt: string) {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);

  useEffect(() => {
    // Inicializar solo en cliente para evitar hydration mismatch
    setTimeLeft(getTimeLeft(closesAt));
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(closesAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [closesAt]);

  return timeLeft;
}

function getTimeLeft(closesAt: string) {
  const diff = new Date(closesAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSeconds = Math.floor(diff / 1000);
  const days    = Math.floor(totalSeconds / 86400);
  const hours   = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, totalSeconds };
}

function CountdownBadge({ closesAt }: { closesAt: string }) {
  const timeLeft = useCountdown(closesAt);

  if (!timeLeft) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 px-2 py-1 rounded-full">
        <Clock size={10} /> Cerrado
      </span>
    );
  }

  const { days, hours, minutes, seconds } = timeLeft;

  const label = days > 0
    ? `${days}d ${hours}h ${minutes}m`
    : hours > 0
    ? `${hours}h ${minutes}m ${seconds}s`
    : `${minutes}m ${seconds}s`;

  // Color según urgencia
  const colorClass = timeLeft.totalSeconds < 3600
    ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"
    : timeLeft.totalSeconds < 86400
    ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";

  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
      colorClass,
    )}>
      <Clock size={10} />
      Cierra en {label}
    </span>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  event: SpecialEvent;
  currentPick: string | null;
}

export function ChampionPicker({ event, currentPick }: Props) {
  const [selected, setSelected]      = useState<string | null>(currentPick);
  const [confirmed, setConfirmed]    = useState<string | null>(currentPick);
  const [search, setSearch]          = useState("");
  const [expanded, setExpanded]      = useState(false);
  const [error, setError]            = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isOpen =
    event.status === "ACTIVE" &&
    new Date() >= new Date(event.opensAt) &&
    new Date() <= new Date(event.closesAt);

  const filtered = TEAMS.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleConfirm() {
    if (!selected || confirmed) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/champion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: event.eventId, answer: selected }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Error al guardar tu predicción");
          return;
        }
        setConfirmed(selected);
        setExpanded(false);
      } catch {
        setError("Error de conexión. Intenta de nuevo.");
      }
    });
  }

  // ── Ya eligió → mostrar locked ───────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="rounded-2xl border border-[#10b959]/30 bg-[#10b959]/5 p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#10b959]/20 flex items-center justify-center shrink-0">
              <Lock size={18} className="text-[#10b959]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Tu campeón elegido
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Bloqueado — recibirás <strong>{event.points} pts</strong> si aciertas
              </p>
            </div>
          </div>
          <CountdownBadge closesAt={event.closesAt} />
        </div>
        <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <span className="text-2xl">{FLAGS[confirmed] ?? "🏳️"}</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-lg flex-1">
            {confirmed}
          </span>
          <Trophy size={16} className="text-yellow-500" />
        </div>
      </div>
    );
  }

  // ── Evento cerrado ────────────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-5 text-center">
        <Trophy size={24} className="mx-auto text-zinc-400 mb-2" />
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          El evento de predicción del campeón está cerrado.
        </p>
      </div>
    );
  }

  // ── Picker activo ─────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/10 p-5">

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
          <Trophy size={18} className="text-amber-500" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm leading-tight">
            {event.title}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Acierta y ganas <strong className="text-amber-500">{event.points} pts</strong>.
            Solo puedes elegir una vez.
          </p>
        </div>
        {/* Countdown */}
        <CountdownBadge closesAt={event.closesAt} />
      </div>

      {/* Selección actual */}
      {selected && (
        <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <span className="text-xl">{FLAGS[selected] ?? "🏳️"}</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm flex-1">
            {selected}
          </span>
          <button
            onClick={() => setSelected(null)}
            className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Cambiar
          </button>
        </div>
      )}

      {/* Toggle lista */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors mb-3"
      >
        {selected ? "Cambiar selección" : "Elige tu campeón →"}
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* Lista expandible */}
      {expanded && (
        <div className="mb-3">
          <input
            type="text"
            placeholder="Buscar país..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 mb-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:border-amber-400 transition-colors"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-52 overflow-y-auto pr-1">
            {filtered.map((team) => (
              <button
                key={team}
                onClick={() => { setSelected(team); setExpanded(false); setSearch(""); }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                  selected === team
                    ? "bg-amber-400/20 border border-amber-400/50 text-amber-700 dark:text-amber-400"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-amber-400/40",
                )}
              >
                <span className="text-base shrink-0">{FLAGS[team] ?? "🏳️"}</span>
                <span className="truncate text-xs">{team}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      {/* Botón confirmar */}
      <button
        onClick={handleConfirm}
        disabled={!selected || isPending}
        className={cn(
          "w-full py-3 rounded-xl font-bold text-sm transition-all",
          selected && !isPending
            ? "bg-amber-500 hover:bg-amber-600 text-white"
            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed",
        )}
      >
        {isPending ? "Guardando..." : selected ? `Confirmar: ${FLAGS[selected] ?? ""} ${selected}` : "Elige un país primero"}
      </button>
    </div>
  );
}