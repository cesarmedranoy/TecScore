/**
 * ChampionPicker — UI para que el jugador elija el campeón del Mundial.
 *
 * Guarda en: src/components/gamified/ChampionPicker.tsx
 *
 * Estados:
 *  - Sin evento activo         → no renderiza nada
 *  - Evento activo + sin pick  → muestra el picker con los 48 países
 *  - Ya eligió                 → muestra su elección (locked)
 *  - Fuera de ventana          → muestra cuenta regresiva o "cerrado"
 */

"use client";

import { useState, useEffect, useTransition } from "react";
import { Trophy, Lock, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpecialEvent } from "@/types";

// 48 selecciones clasificadas al Mundial 2026
const TEAMS = [
  // CONMEBOL (6)
  "Argentina", "Brasil", "Colombia", "Ecuador", "Uruguay", "Venezuela",
  // CONCACAF (6)
  "México", "Estados Unidos", "Canadá", "Costa Rica", "Jamaica", "Panamá",
  // UEFA (16)
  "Alemania", "España", "Francia", "Inglaterra", "Portugal", "Países Bajos",
  "Bélgica", "Italia", "Croacia", "Austria", "Suiza", "Dinamarca",
  "Escocia", "Turquía", "Serbia", "Hungría",
  // CAF — África (9)
  "Marruecos", "Senegal", "Nigeria", "Egipto", "Camerún",
  "Costa de Marfil", "Mali", "Ghana", "Sudáfrica",
  // AFC — Asia (8)
  "Japón", "Corea del Sur", "Arabia Saudita", "Irán",
  "Australia", "Irak", "Uzbekistán", "Jordania",
  // OFC (1) + repechajes (2) + anfitriones (1)
  "Nueva Zelanda", "Perú", "Indonesia", "China",
].sort();

// Emojis de banderas por país (los más relevantes)
const FLAGS: Record<string, string> = {
  "Argentina": "🇦🇷", "Brasil": "🇧🇷", "Colombia": "🇨🇴", "Ecuador": "🇪🇨",
  "Uruguay": "🇺🇾", "Venezuela": "🇻🇪", "México": "🇲🇽", "Estados Unidos": "🇺🇸",
  "Canadá": "🇨🇦", "Costa Rica": "🇨🇷", "Jamaica": "🇯🇲", "Panamá": "🇵🇦",
  "Alemania": "🇩🇪", "España": "🇪🇸", "Francia": "🇫🇷", "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Portugal": "🇵🇹", "Países Bajos": "🇳🇱", "Bélgica": "🇧🇪", "Italia": "🇮🇹",
  "Croacia": "🇭🇷", "Austria": "🇦🇹", "Suiza": "🇨🇭", "Dinamarca": "🇩🇰",
  "Escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Turquía": "🇹🇷", "Serbia": "🇷🇸", "Hungría": "🇭🇺",
  "Marruecos": "🇲🇦", "Senegal": "🇸🇳", "Nigeria": "🇳🇬", "Egipto": "🇪🇬",
  "Camerún": "🇨🇲", "Costa de Marfil": "🇨🇮", "Mali": "🇲🇱", "Ghana": "🇬🇭",
  "Sudáfrica": "🇿🇦", "Japón": "🇯🇵", "Corea del Sur": "🇰🇷",
  "Arabia Saudita": "🇸🇦", "Irán": "🇮🇷", "Australia": "🇦🇺", "Irak": "🇮🇶",
  "Uzbekistán": "🇺🇿", "Jordania": "🇯🇴", "Nueva Zelanda": "🇳🇿",
  "Perú": "🇵🇪", "Indonesia": "🇮🇩", "China": "🇨🇳",
};

interface Props {
  event: SpecialEvent;
  currentPick: string | null;
}

export function ChampionPicker({ event, currentPick }: Props) {
  const [selected, setSelected]   = useState<string | null>(currentPick);
  const [confirmed, setConfirmed] = useState<string | null>(currentPick);
  const [search, setSearch]       = useState("");
  const [expanded, setExpanded]   = useState(false);
  const [error, setError]         = useState<string | null>(null);
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#10b959]/20 flex items-center justify-center shrink-0">
            <Lock size={18} className="text-[#10b959]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Tu campeón elegido
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Bloqueado — recibirás {event.points} pts si aciertas
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <span className="text-2xl">{FLAGS[confirmed] ?? "🏳️"}</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">
            {confirmed}
          </span>
          <Trophy size={16} className="ml-auto text-yellow-500" />
        </div>
      </div>
    );
  }

  // ── Evento cerrado o no activo ────────────────────────────────────────────
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
        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full shrink-0">
          1 día
        </span>
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

      {/* Toggle lista de países */}
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
            className="w-full px-3 py-2 mb-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#10b959] transition-colors"
          />
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
            {filtered.map((team) => (
              <button
                key={team}
                onClick={() => { setSelected(team); setExpanded(false); setSearch(""); }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left",
                  selected === team
                    ? "bg-[#10b959]/15 border border-[#10b959]/40 text-[#10b959]"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-[#10b959]/40",
                )}
              >
                <span className="text-base shrink-0">{FLAGS[team] ?? "🏳️"}</span>
                <span className="truncate">{team}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 mb-2">{error}</p>
      )}

      {/* Botón confirmar */}
      <button
        onClick={handleConfirm}
        disabled={!selected || isPending}
        className={cn(
          "w-full py-3 rounded-xl font-bold text-sm transition-all",
          selected && !isPending
            ? "bg-[#10b959] hover:bg-[#0ea84f] text-white"
            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed",
        )}
      >
        {isPending ? "Guardando..." : `Confirmar: ${selected ?? "elige un país"}`}
      </button>
    </div>
  );
}