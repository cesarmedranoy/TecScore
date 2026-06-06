/**
 * /admin/grupos — gestión global de grupos.
 * Vista de solo lectura por ahora; el admin puede ver todos los grupos.
 * Eliminar/editar se agrega en una siguiente iteración.
 */

import { Layers } from "lucide-react";
import { ddb } from "@/lib/aws/client";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { TABLES } from "@/lib/aws/tables";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Group } from "@/types";

export default async function AdminGruposPage() {
  const res = await ddb.send(new ScanCommand({ TableName: TABLES.GROUPS }));
  const groups = (res.Items as Group[]) ?? [];
  groups.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Grupos</h1>
        <p className="text-muted-foreground mt-1">
          Todos los grupos creados por usuarios en la plataforma.
        </p>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="pt-16 pb-16 flex flex-col items-center text-center gap-3">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Layers className="size-8" />
            </div>
            <h3 className="text-lg font-semibold">Aún no hay grupos</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Los usuarios podrán crear grupos desde su panel "Mis grupos".
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="px-3 py-3">Nombre</th>
                  <th className="px-3 py-3">Código</th>
                  <th className="px-3 py-3">Visibilidad</th>
                  <th className="px-3 py-3 text-right">Miembros</th>
                  <th className="px-3 py-3">Creado</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr
                    key={g.groupId}
                    className="border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-3 py-3 font-medium">{g.name}</td>
                    <td className="px-3 py-3 font-mono text-xs">
                      {g.joinCode}
                    </td>
                    <td className="px-3 py-3">
                      <Badge
                        variant={g.visibility === "PRIVATE" ? "muted" : "outline"}
                      >
                        {g.visibility}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {g.memberCount} / {g.maxMembers}
                    </td>
                    <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(g.createdAt).toLocaleDateString("es")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
