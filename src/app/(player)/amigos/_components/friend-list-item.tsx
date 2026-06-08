"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { PlayerAvatar } from "@/components/gamified/player-avatar";
import { PointsBadge } from "@/components/gamified/points-badge";
import { ProfileHoverCard } from "@/components/gamified/profile-hover-card";
import { Button } from "@/components/ui/button";
import {
  acceptFriendRequestAction,
  rejectOrCancelFriendAction,
  removeFriendAction,
} from "../actions";
import type { AvatarPreset } from "@/types";

interface FriendListItemProps {
  user: {
    userId: string;
    displayName: string;
    tag: string;
    avatarUrl: string;
    avatarPreset: AvatarPreset;
    customAvatarDataUrl?: string;
    totalPoints: number;
  };
  variant: "received" | "friend" | "sent";
}

export function FriendListItem({ user, variant }: FriendListItemProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function accept() {
    startTransition(async () => {
      const r = await acceptFriendRequestAction(user.userId);
      if (r.error) toast.error(r.error);
      else {
        toast.success(r.success ?? "¡Ahora son amigos!");
        router.refresh();
      }
    });
  }

  function reject() {
    startTransition(async () => {
      const r = await rejectOrCancelFriendAction(user.userId);
      if (r.error) toast.error(r.error);
      else {
        toast.success(r.success ?? "Descartado");
        router.refresh();
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const r = await removeFriendAction(user.userId);
      if (r.error) toast.error(r.error);
      else {
        toast.success(r.success ?? "Amistad eliminada");
        router.refresh();
      }
    });
  }

  return (
    <li className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/40 transition-colors">
      <ProfileHoverCard userId={user.userId}>
        <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
          <PlayerAvatar
            name={user.displayName}
            avatarUrl={user.avatarUrl}
            customAvatarDataUrl={user.customAvatarDataUrl}
            preset={user.avatarPreset}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {user.displayName}
              <span className="text-muted-foreground">#{user.tag}</span>
            </p>
          </div>
        </div>
      </ProfileHoverCard>
      <PointsBadge points={user.totalPoints} size="sm" />
      <div className="flex items-center gap-1.5 shrink-0">
        {variant === "received" && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={reject}
              disabled={pending}
            >
              <X />
              Rechazar
            </Button>
            <Button size="sm" onClick={accept} disabled={pending}>
              <Check />
              Aceptar
            </Button>
          </>
        )}
        {variant === "friend" && (
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/chats/${user.userId}`}>
                <MessageCircle />
                Chat
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={remove}
              disabled={pending}
            >
              <X />
              Quitar
            </Button>
          </>
        )}
        {variant === "sent" && (
          <Button
            variant="outline"
            size="sm"
            onClick={reject}
            disabled={pending}
          >
            <X />
            Cancelar
          </Button>
        )}
      </div>
    </li>
  );
}