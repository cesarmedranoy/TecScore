/**
 * NotificationBell — campana con dropdown de notifs.
 *
 * Refresca cada 30s en background (polling). Para "tiempo real puro"
 * pasamos a WebSockets/Pusher en Fase 7.
 *
 * Click en una notif → marca como leída + navega al `metadata.link`.
 */

"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchMyNotifications,
  markNotifReadAction,
  markAllNotifsReadAction,
} from "@/app/(player)/notifications/actions";
import type { Notification } from "@/types";

const POLL_INTERVAL_MS = 30_000;

export function NotificationBell() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  async function refresh() {
    try {
      const data = await fetchMyNotifications();
      setNotifs(data.notifications);
      setUnread(data.unread);
    } catch {
      /* silent — el polling reintentará */
    }
  }

  // Cargar al montar + polling
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  // Refrescar al abrir el dropdown (estado fresco)
  useEffect(() => {
    if (open) refresh();
  }, [open]);

  function handleClick(n: Notification) {
    if (!n.read) {
      startTransition(async () => {
        await markNotifReadAction(n.notifId);
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

  return (
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
          {/* Backdrop para cerrar al hacer click fuera */}
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

            {notifs.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                Aún no hay notificaciones
              </div>
            ) : (
              <ul className="max-h-96 overflow-y-auto divide-y divide-border">
                {notifs.map((n) => (
                  <li key={n.notifId}>
                    <button
                      type="button"
                      onClick={() => handleClick(n)}
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex gap-3 items-start",
                        !n.read && "bg-primary/5",
                      )}
                    >
                      {!n.read && (
                        <span className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {n.title}
                        </p>
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
