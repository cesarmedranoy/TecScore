/**
 * /mis-grupos — listado de los grupos del usuario.
 *
 * Empty state si no tiene grupos.
 */

import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { auth } from "@/auth";
import { groupService } from "@/server/services/group-service";
import { Card, CardContent } from "@/components/ui/card";
import { CreateGroupDialog } from "./_components/create-group-dialog";
import { JoinGroupDialog } from "./_components/join-group-dialog";
import { GroupCard } from "./_components/group-card";
import { MAX_GROUPS_PER_USER } from "@/server/services/group-service";

export default async function MisGruposPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const groups = await groupService.listMyGroups(session.user.userId);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mis grupos</h1>
          <p className="text-muted-foreground mt-1">
            Sumate a hasta {MAX_GROUPS_PER_USER} grupos para competir con tus
            amigos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <JoinGroupDialog />
          <CreateGroupDialog />
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <GroupCard
              key={g.groupId}
              group={g}
              isOwner={g.ownerId === session.user.userId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="pt-16 pb-16 flex flex-col items-center text-center gap-4">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <Users className="size-8" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <h3 className="text-lg font-semibold">Todavía no estás en ningún grupo</h3>
          <p className="text-sm text-muted-foreground">
            Creá uno tuyo o uní con un código que te haya pasado un amigo.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <JoinGroupDialog />
          <CreateGroupDialog />
        </div>
      </CardContent>
    </Card>
  );
}
