/**
 * PendingRequests — lista de solicitudes pendientes (solo owner las ve).
 *
 * Cada solicitud tiene 2 botones: Aprobar / Rechazar.
 * Calls a la API directamente con fetch — sin server actions porque
 * son muchas filas y no queremos un revalidate por cada click.
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage, getInitials } from "@/components/ui/avatar";

interface RequestItem {
  groupId: string;
  userId: string;
  requestedAt: string;
  expiresAt: string;
  requester: {
    userId: string;
    displayName: string;
    tag: string;
    avatarUrl: string;
  };
}

interface PendingRequestsProps {
  groupId: string;
  requests: RequestItem[];
}

export function PendingRequests({ groupId, requests }: PendingRequestsProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function decide(targetUserId: string, decision: "APPROVE" | "REJECT") {
    setError(null);
    setProcessing((prev) => new Set(prev).add(targetUserId));
    try {
      const res = await fetch(
        `/api/groups/${groupId}/requests/${targetUserId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al procesar");
        return;
      }
      startTransition(() => router.refresh());
    } finally {
      setProcessing((prev) => {
        const copy = new Set(prev);
        copy.delete(targetUserId);
        return copy;
      });
    }
  }

  return (
    <Card>
      <CardContent className="pt-6 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Solicitudes pendientes</h2>
          <span className="text-xs text-muted-foreground">
            ({requests.length})
          </span>
        </div>
        {error && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {requests.map((r) => {
            const isProcessing = processing.has(r.userId);
            const hoursLeft = Math.max(
              0,
              Math.round(
                (new Date(r.expiresAt).getTime() - Date.now()) /
                  (1000 * 60 * 60),
              ),
            );
            return (
              <li
                key={r.userId}
                className="flex items-center gap-3 px-3 py-2 rounded-md border border-border"
              >
                <Avatar className="size-9">
                  {r.requester.avatarUrl && (
                    <AvatarImage
                      src={r.requester.avatarUrl}
                      alt={r.requester.displayName}
                    />
                  )}
                  <AvatarFallback>
                    {getInitials(r.requester.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {r.requester.displayName}
                    <span className="text-muted-foreground">
                      #{r.requester.tag}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    Quedan {hoursLeft}h
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => decide(r.userId, "REJECT")}
                  disabled={isProcessing}
                >
                  <X />
                  Rechazar
                </Button>
                <Button
                  size="sm"
                  onClick={() => decide(r.userId, "APPROVE")}
                  disabled={isProcessing}
                >
                  <Check />
                  Aprobar
                </Button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
