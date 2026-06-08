/**
 * AdminEventsList — Client Component para gestionar eventos especiales.
 *
 * Guarda en: src/app/(admin)/admin/eventos/AdminEventsList.tsx
 */

"use client";

import { useState, useTransition } from "react";
import { Plus, Trophy, Clock, CheckCircle, XCircle, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SpecialEvent, SpecialEventStatus } from "@/types";

const STATUS_LABELS: Record<SpecialEventStatus, string> = {
  DRAFT:    "Borrador",
  ACTIVE:   "Activo",
  CLOSED:   "Cerrado",
  RESOLVED: "Resuelto",
};

const STATUS_COLORS: Record<SpecialEventStatus, string> = {
  DRAFT:    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  ACTIVE:   "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  CLOSED:   "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  RESOLVED: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
};

interface Props {
  initialEvents: SpecialEvent[];
}

export function AdminEventsList({ initialEvents }: Props) {
  const [events, setEvents]           = useState<SpecialEvent[]>(initialEvents);
  const [showForm, setShowForm]       = useState(false);
  const [resolveId, setResolveId]     = useState<string | null>(null);
  const [resolveAnswer, setResolveAnswer] = useState("");
  const [error, setError]             = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  // ── Formulario nuevo evento ───────────────────────────────────────────────
  const [form, setForm] = useState({
    title: "¿Quién ganará el Mundial 2026?",
    description: "Elige el campeón y gana puntos si aciertas.",
    type: "CHAMPION_PICK",
    points: 100,
    opensAt: "2026-06-11T00:00",
    closesAt: "2026-06-11T23:59",
  });

  async function handleCreate() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          opensAt: new Date(form.opensAt).toISOString(),
          closesAt: new Date(form.closesAt).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al crear el evento"); return; }
      setEvents((prev) => [data.event, ...prev]);
      setShowForm(false);
    });
  }

  async function handleStatus(eventId: string, status: SpecialEventStatus) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { setError("Error al actualizar el estado"); return; }
      setEvents((prev) =>
        prev.map((e) => e.eventId === eventId ? { ...e, status } : e),
      );
    });
  }

  async function handleResolve(eventId: string) {
    if (!resolveAnswer.trim()) { setError("Ingresa la respuesta correcta"); return; }
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correctAnswer: resolveAnswer.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al resolver"); return; }
      setEvents((prev) =>
        prev.map((e) =>
          e.eventId === eventId
            ? { ...e, status: "RESOLVED", correctAnswer: resolveAnswer.trim() }
            : e,
        ),
      );
      setResolveId(null);
      setResolveAnswer("");
      alert(`✅ ${data.message}`);
    });
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Botón crear */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          Nuevo evento
        </button>
      </div>

      {/* Formulario crear */}
      {showForm && (
        <Card>
          <CardContent className="pt-5 flex flex-col gap-3">
            <h2 className="font-semibold text-sm">Crear evento especial</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-xs text-muted-foreground font-medium">Título</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-lg border border-border bg-background outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-xs text-muted-foreground font-medium">Descripción (opcional)</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-lg border border-border bg-background outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Puntos en juego</label>
                <input
                  type="number"
                  value={form.points}
                  onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))}
                  className="px-3 py-2 text-sm rounded-lg border border-border bg-background outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-lg border border-border bg-background outline-none focus:border-red-500 transition-colors"
                >
                  <option value="CHAMPION_PICK">Predicción de campeón</option>
                  <option value="YES_NO">Sí / No</option>
                  <option value="TOP_SCORER">Goleador</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Abre el</label>
                <input
                  type="datetime-local"
                  value={form.opensAt}
                  onChange={(e) => setForm((f) => ({ ...f, opensAt: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-lg border border-border bg-background outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground font-medium">Cierra el</label>
                <input
                  type="datetime-local"
                  value={form.closesAt}
                  onChange={(e) => setForm((f) => ({ ...f, closesAt: e.target.value }))}
                  className="px-3 py-2 text-sm rounded-lg border border-border bg-background outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-50"
              >
                {isPending ? "Creando..." : "Crear evento"}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de eventos */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10 flex flex-col items-center gap-3 text-center">
            <Trophy size={32} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No hay eventos creados aún. Crea el primero.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <Card key={event.eventId}>
              <CardContent className="pt-4 pb-4 flex flex-col gap-3">

                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{event.title}</h3>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                        STATUS_COLORS[event.status],
                      )}>
                        {STATUS_LABELS[event.status]}
                      </span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-black text-red-600">{event.points}</span>
                    <span className="text-xs text-muted-foreground ml-0.5">pts</span>
                  </div>
                </div>

                {/* Fechas */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    Abre: {new Date(event.opensAt).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    Cierra: {new Date(event.closesAt).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>

                {/* Respuesta correcta si ya está resuelto */}
                {event.correctAnswer && (
                  <div className="flex items-center gap-2 text-xs bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-lg">
                    <CheckCircle size={12} />
                    Respuesta correcta: <strong>{event.correctAnswer}</strong>
                  </div>
                )}

                {/* Acciones */}
                {event.status !== "RESOLVED" && (
                  <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border">
                    {event.status === "DRAFT" && (
                      <button
                        onClick={() => handleStatus(event.eventId, "ACTIVE")}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                      >
                        <Zap size={12} /> Activar
                      </button>
                    )}
                    {event.status === "ACTIVE" && (
                      <button
                        onClick={() => handleStatus(event.eventId, "CLOSED")}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50"
                      >
                        <XCircle size={12} /> Cerrar
                      </button>
                    )}
                    {(event.status === "ACTIVE" || event.status === "CLOSED") && (
                      <>
                        {resolveId === event.eventId ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              placeholder="Ej: Argentina"
                              value={resolveAnswer}
                              onChange={(e) => setResolveAnswer(e.target.value)}
                              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-background outline-none focus:border-red-500"
                            />
                            <button
                              onClick={() => handleResolve(event.eventId)}
                              disabled={isPending}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                            >
                              {isPending ? "..." : "Confirmar"}
                            </button>
                            <button
                              onClick={() => { setResolveId(null); setResolveAnswer(""); }}
                              className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setResolveId(event.eventId)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                          >
                            <CheckCircle size={12} /> Resolver y otorgar puntos
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}

                {error && resolveId === event.eventId && (
                  <p className="text-xs text-red-500">{error}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}