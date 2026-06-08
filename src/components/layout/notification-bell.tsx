/**
 * NotificationBell — campana con dropdown de notifs.
 *
 * Mejoras:
 *  - Auto-dismiss: las notificaciones se cierran solas después de 5s
 *    con una barra de progreso visual.
 *  - Agrupación de mensajes de chat: en vez de "6 notifs de mensaje",
 *    muestra "6 mensajes nuevos en Los Galácticos".
 *  - Cola máxima de 3 toasts visibles a la vez.
 *  - El polling y el resto de la lógica original están intactos.
 */

"use client";

import { useEffect, useState, useTransition, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchMyNotifications,
  markNotifReadAction,
  markAllNotifsReadAction,
} from "@/app/(player)/notifications/actions";
import type { Notification } from "@/types";

const POLL_INTERVAL_MS = 30_000;
const TOAST_DURATION_MS = 5_000;
const MAX_TOASTS = 3;

// ── Toast types ───────────────────────────────────────────────────────────────
interface Toast {
  id: string;
  title: string;
  body: string;
  link?: string;
  progress: number; // 0-100
}

// ── Agrupar notifs de chat por grupo ─────────────────────────────────────────
// Si hay múltiples CHAT_MESSAGE del mismo grupo, las colapsa en una sola.
// (el tipo CHAT_MESSAGE no está en el union de Notification pero puede venir
//  en metadata.groupName — lo detectamos por el título)
function groupNotifications(notifs: Notification[]): Notification[] {
  const chatGroups = new Map<string, Notification[]>();
  const rest: Notification[] = [];

  for (const n of notifs) {
    // Detectar notifs de chat por metadata.groupId
    const groupId = n.metadata?.groupId;
    if (groupId && !n.read) {
      const existing = chatGroups.get(groupId) ?? [];
      chatGroups.set(groupId, [...existing, n]);
    } else {
      rest.push(n);
    }
  }

  // Convertir grupos de chat en una notif resumida
  const grouped: Notification[] = [];
  for (const [, msgs] of chatGroups) {
    if (msgs.length === 1) {
      grouped.push(msgs[0]!);
    } else {
      const first = msgs[0]!;
      const groupName = first.metadata?.groupName ?? "tu grupo";
      grouped.push({
        ...first,
        title: `${msgs.length} mensajes nuevos en ${groupName}`,
        body: `Tienes ${msgs.length} mensajes sin leer.`,
        // Guardamos todos los notifIds para marcarlos todos leídos de una
        metadata: {
          ...first.metadata,
          groupedIds: msgs.map((m) => m.notifId).join(","),
        },
      });
    }
  }

  // Orden: no leídas primero, luego por fecha desc
  return [...grouped, ...rest].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// ── Toast component ───────────────────────────────────────────────────────────
function ToastItem({
  toast,
  onDismiss,
  onClick,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
  onClick: (toast: Toast) => void;
}) {
  return (
    <div
      className={cn(
        "relative flex items-start gap-3 px-4 py-3 rounded-xl border border-border",
        "bg-card shadow-lg overflow-hidden cursor-pointer",
        "animate-in slide-in-from-right-4 fade-in duration-300",
      )}
      onClick={() => onClick(toast)}
    >
      {/* Barra de progreso */}
      <div
        className="absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-100"
        style={{ width: `${toast.progress}%` }}
      />

      <Bell className="size-4 text-primary shrink-0 mt-0.5" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{toast.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
          {toast.body}
        </p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(toast.id); }}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Cerrar"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function NotificationBell() {
  const router = useRouter();
  const [notifs, setNotifs]   = useState<Notification[]>([]);
  const [unread, setUnread]   = useState(0);
  const [open, setOpen]       = useState(false);
  const [toasts, setToasts]   = useState<Toast[]>([]);
  const [, startTransition]   = useTransition();
  const prevUnreadRef         = useRef(0);
  const toastTimers           = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

  // ── Dismiss toast ─────────────────────────────────────────────────────────
  const dismissToast = useCallback((id: string) => {
    const timer = toastTimers.current.get(id);
    if (timer) { clearInterval(timer); toastTimers.current.delete(id); }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Añadir toast con auto-dismiss ─────────────────────────────────────────
  const addToast = useCallback((notif: Notification) => {
    const id = notif.notifId;

    setToasts((prev) => {
      // Máximo MAX_TOASTS visibles — eliminar el más viejo si se pasa
      const updated = prev.length >= MAX_TOASTS ? prev.slice(1) : prev;
      return [...updated, {
        id,
        title: notif.title,
        body: notif.body,
        link: notif.metadata?.link,
        progress: 100,
      }];
    });

    // Barra de progreso — decrementar cada 50ms
    const interval = setInterval(() => {
      setToasts((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, progress: Math.max(0, t.progress - (50 / TOAST_DURATION_MS) * 100) }
            : t,
        ),
      );
    }, 50);

    // Auto-dismiss al llegar a 0
    setTimeout(() => {
      clearInterval(interval);
      toastTimers.current.delete(id);
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);

    toastTimers.current.set(id, interval);
  }, []);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      toastTimers.current.forEach((t) => clearInterval(t));
    };
  }, []);

  // ── Fetch notificaciones ──────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const data = await fetchMyNotifications();
      setNotifs(data.notifications);
      setUnread(data.unread);

      // Mostrar toasts solo para notifs NUEVAS no leídas
      // (comparando con el unread anterior)
      if (data.unread > prevUnreadRef.current) {
        const newUnread = data.notifications
          .filter((n) => !n.read)
          .slice(0, data.unread - prevUnreadRef.current);

        // Agrupar mensajes de chat antes de toastear
        const grouped = groupNotifications(newUnread);
        grouped.slice(0, MAX_TOASTS).forEach(addToast);
      }
      prevUnreadRef.current = data.unread;
    } catch {
      /* silent */
    }
  }, [addToast]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

useEffect(() => {
  if (open) {
    refresh();
    // Si hay no leídas, marcarlas todas al abrir
    if (unread > 0) {
      startTransition(async () => {
        await markAllNotifsReadAction();
        await refresh();
      });
    }
  }
}, [open]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  async function handleClick(n: Notification) {
    if (!n.read) {
      startTransition(async () => {
        // Si es una notif agrupada, marcar todas las IDs
        const groupedIds = n.metadata?.groupedIds;
        if (groupedIds) {
          await Promise.all(
            groupedIds.split(",").map((id) => markNotifReadAction(id)),
          );
        } else {
          await markNotifReadAction(n.notifId);
        }
        await refresh();
      });
    }
    const link = n.metadata?.link;
    if (link) {
      setOpen(false);
      router.push(link);
    }
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotifsReadAction();
      await refresh();
    });
  }

  function handleToastClick(toast: Toast) {
    dismissToast(toast.id);
    if (toast.link) router.push(toast.link);
  }

  const displayNotifs = groupNotifications(notifs);

  return (
    <>
      {/* ── Toasts — esquina inferior derecha ── */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
            onClick={handleToastClick}
          />
        ))}
      </div>

      {/* ── Campana ── */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen((o) => !o)}
          aria-label="Notificaciones"
          title="Notificaciones"
        >
          <Bell />
          {unread > 0 && (
            <span className="absolute top-1 right-1 size-4 min-w-[16px] rounded-full bg-danger text-danger-foreground text-[10px] font-bold flex items-center justify-center px-1 pointer-events-none">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>

        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            />

            <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] z-50 rounded-lg border border-border bg-card shadow-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold">Notificaciones</h3>
                {unread > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAll}
                    className="text-xs"
                  >
                    <Check className="size-3" />
                    Marcar todo leído
                  </Button>
                )}
              </div>

              {displayNotifs.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Aún no hay notificaciones
                </div>
              ) : (
                <ul className="max-h-96 overflow-y-auto divide-y divide-border">
                  {displayNotifs.map((n) => (
                    <li key={n.notifId}>
                      <button
                        type="button"
                        onClick={() => handleClick(n)}
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3 items-start",
                          !n.read && "bg-primary/5",
                        )}
                      >
                        {/* Icono según tipo */}
                        <div className="shrink-0 mt-0.5">
                          {n.metadata?.groupId ? (
                            <MessageCircle className="size-4 text-primary" />
                          ) : (
                            !n.read && (
                              <span className="size-2 rounded-full bg-primary mt-1 block" />
                            )
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{n.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {n.body}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "ahora";
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(iso).toLocaleDateString("es-PE", {
    month: "short",
    day: "numeric",
  });
}