/**
 * ChatWindow — UI de la conversación.
 *
 *  - Lista de mensajes con scroll auto al final
 *  - Polling cada 3s para nuevos mensajes
 *  - Input + botón enviar (server action)
 *  - Burbujas estilo iMessage: derecha tú, izquierda amigo
 */

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendDmAction } from "../../actions";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

const POLL_INTERVAL_MS = 3000;
const MAX_LENGTH = 500;

interface ChatWindowProps {
  friendId: string;
  myUserId: string;
  initialMessages: ChatMessage[];
}

export function ChatWindow({
  friendId,
  myUserId,
  initialMessages,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Polling
  useEffect(() => {
    let cancelled = false;
    async function fetchMessages() {
      try {
        const r = await fetch(`/api/chats/${friendId}/messages`, {
          cache: "no-store",
        });
        if (!r.ok) return;
        const data = (await r.json()) as { messages: ChatMessage[] };
        if (cancelled) return;
        setMessages(data.messages);
      } catch {
        /* silent */
      }
    }
    const id = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [friendId]);

  // Scroll al final cuando llegan mensajes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_LENGTH) {
      toast.error(`Máximo ${MAX_LENGTH} caracteres`);
      return;
    }
    setText("");
    inputRef.current?.focus();
    startTransition(async () => {
      const res = await sendDmAction(friendId, trimmed);
      if (res.error) {
        toast.error(res.error);
        setText(trimmed); // restaurar lo que tipeó
      } else {
        // Refrescar inmediatamente sin esperar el polling
        try {
          const r = await fetch(`/api/chats/${friendId}/messages`, {
            cache: "no-store",
          });
          const data = (await r.json()) as { messages: ChatMessage[] };
          setMessages(data.messages);
        } catch {
          /* el polling lo agarra después */
        }
      }
    });
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex-1 flex flex-col border border-border rounded-lg bg-card overflow-hidden">
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground text-center px-4">
            <p>
              Aún no hay mensajes.
              <br />
              ¡Manda el primero!
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.userId === myUserId;
            return (
              <div
                key={m.messageId}
                className={cn(
                  "flex flex-col gap-1 max-w-[75%]",
                  isMe ? "self-end items-end" : "self-start items-start",
                )}
              >
                {!isMe && (
                  <span className="text-[10px] text-muted-foreground ml-3">
                    {m.userName}
                  </span>
                )}
                <div
                  className={cn(
                    "px-3.5 py-2 rounded-2xl text-sm break-words",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm",
                  )}
                >
                  {m.text}
                </div>
                <span className="text-[10px] text-muted-foreground px-2" suppressHydrationWarning>
                  {formatTime(m.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 flex items-end gap-2 bg-card">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="Escribe un mensaje... (Enter para enviar)"
          rows={1}
          maxLength={MAX_LENGTH}
          className={cn(
            "flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "max-h-32 overflow-y-auto",
          )}
        />
        <Button
          size="icon"
          onClick={send}
          disabled={pending || text.trim().length === 0}
          aria-label="Enviar"
        >
          <Send />
        </Button>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  if (typeof window === "undefined") return ""; // servidor → string vacío
  const d = new Date(iso);
  return d.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
