/**
 * GroupChat — chat en tiempo real del grupo.
 *
 * Guarda en: src/app/(player)/mis-grupos/[groupId]/_components/GroupChat.tsx
 */

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sendGroupMessageAction } from "../actions-chat";
import type { ChatMessage } from "@/types";

const POLL_INTERVAL_MS = 3_000;
const MAX_LENGTH = 500;

interface GroupChatProps {
  groupId: string;
  myUserId: string;
  initialMessages: ChatMessage[];
  fullHeight?: boolean; // true = ocupa toda la altura disponible
}

export function GroupChat({
  groupId,
  myUserId,
  initialMessages,
  fullHeight = false,
}: GroupChatProps) {
  const [messages, setMessages]        = useState<ChatMessage[]>(initialMessages);
  const [text, setText]                = useState("");
  const [pending, startTransition]     = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Polling
  useEffect(() => {
    let cancelled = false;
    async function fetchMessages() {
      try {
        const r = await fetch(`/api/groups/${groupId}/messages`, {
          cache: "no-store",
        });
        if (!r.ok) return;
        const data = (await r.json()) as { messages: ChatMessage[] };
        if (!cancelled) setMessages(data.messages);
      } catch { /* silent */ }
    }
    const id = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [groupId]);

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
      const res = await sendGroupMessageAction(groupId, trimmed);
      if (res.error) {
        toast.error(res.error);
        setText(trimmed);
      } else {
        try {
          const r = await fetch(`/api/groups/${groupId}/messages`, {
            cache: "no-store",
          });
          const data = (await r.json()) as { messages: ChatMessage[] };
          setMessages(data.messages);
        } catch { /* el polling lo agarra */ }
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
    <div
      className={cn(
        "flex flex-col border border-border rounded-xl bg-card overflow-hidden",
        fullHeight ? "h-full" : "h-[500px]",
      )}
    >
      {/* Header — solo en modo embebido */}
      {!fullHeight && (
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
          <p className="font-semibold text-sm">Chat del grupo</p>
          <span className="text-[11px] text-muted-foreground">
            {messages.length} mensajes
          </span>
        </div>
      )}

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground text-center">
            <p>Aún no hay mensajes. ¡Sé el primero en escribir!</p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.userId === myUserId;
            const prevMsg = messages[idx - 1];
            const showName = !isMe && prevMsg?.userId !== m.userId;

            return (
              <div
                key={m.messageId}
                className={cn(
                  "flex flex-col gap-0.5 max-w-[75%]",
                  isMe ? "self-end items-end" : "self-start items-start",
                )}
              >
                {showName && (
                  <span className="text-[10px] text-muted-foreground ml-2 font-medium">
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
      <div className="border-t border-border p-3 flex items-end gap-2 bg-card shrink-0">
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
  if (typeof window === "undefined") return "";
  return new Date(iso).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}