"use client";

import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PlayerAvatar } from "@/components/gamified/player-avatar";
import { PointsBadge } from "@/components/gamified/points-badge";
import { ProfileHoverCard } from "@/components/gamified/profile-hover-card";
import type { AvatarPreset } from "@/types";

interface FoundUser {
  userId: string;
  displayName: string;
  tag: string;
  avatarUrl: string;
  avatarPreset: AvatarPreset;
  customAvatarDataUrl?: string;
  totalPoints: number;
  currentStreak: number;
}

export function SearchPlayers() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoundUser[]>([]);
  const [searched, setSearched] = useState(false);
  const [, startTransition] = useTransition();

  // Debounce: buscar 300ms después de la última tecla
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const id = setTimeout(() => {
      startTransition(async () => {
        try {
          const r = await fetch(
            `/api/users/search?q=${encodeURIComponent(query.trim())}`,
          );
          const data = (await r.json()) as { users: FoundUser[] };
          setResults(data.users ?? []);
          setSearched(true);
        } catch {
          setResults([]);
        }
      });
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Escribe nombre o tag (ej: Cesar o #a4f9)"
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {query.length > 0 && query.length < 2 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Escribe al menos 2 caracteres
        </p>
      )}

      {searched && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          Sin resultados para &quot;{query}&quot;
        </p>
      )}

      {results.length > 0 && (
        <ul className="flex flex-col gap-1">
          {results.map((u) => (
            <li key={u.userId}>
              <ProfileHoverCard userId={u.userId}>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/40 transition-colors">
                  <PlayerAvatar
                    name={u.displayName}
                    avatarUrl={u.avatarUrl}
                    customAvatarDataUrl={u.customAvatarDataUrl}
                    preset={u.avatarPreset}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {u.displayName}
                      <span className="text-muted-foreground">#{u.tag}</span>
                    </p>
                  </div>
                  <PointsBadge points={u.totalPoints} size="sm" />
                </div>
              </ProfileHoverCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
