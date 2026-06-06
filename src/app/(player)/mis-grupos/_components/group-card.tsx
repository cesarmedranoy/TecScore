/**
 * GroupCard — preview de un grupo en la lista "Mis grupos".
 */

import Link from "next/link";
import { Users, Lock, Globe, Crown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Group } from "@/types";

interface GroupCardProps {
  group: Group;
  isOwner: boolean;
  myPosition?: number;
  myPointsInGroup?: number;
}

export function GroupCard({
  group,
  isOwner,
  myPosition,
  myPointsInGroup,
}: GroupCardProps) {
  return (
    <Link href={`/mis-grupos/${group.groupId}`} className="group">
      <Card elevation="raised" className="hover:border-primary/40 transition-colors h-full">
        <CardContent className="pt-6 flex flex-col gap-4 h-full">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg truncate">{group.name}</h3>
                {isOwner && (
                  <Badge variant="accent">
                    <Crown className="size-3" />
                    Owner
                  </Badge>
                )}
              </div>
              {group.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {group.description}
                </p>
              )}
            </div>
            <ChevronRight className="size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>

          <div className="flex items-center gap-2 mt-auto pt-2">
            <Badge variant={group.visibility === "PRIVATE" ? "muted" : "outline"}>
              {group.visibility === "PRIVATE" ? (
                <>
                  <Lock className="size-3" />
                  Privado
                </>
              ) : (
                <>
                  <Globe className="size-3" />
                  Público
                </>
              )}
            </Badge>
            <Badge variant="muted">
              <Users className="size-3" />
              {group.memberCount} / {group.maxMembers}
            </Badge>
            {myPosition !== undefined && (
              <Badge variant="default">#{myPosition} en ranking</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
