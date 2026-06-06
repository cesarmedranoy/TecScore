/**
 * /admin/usuarios — vista de usuarios.
 * Read-only por ahora.
 */

import { ddb } from "@/lib/aws/client";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { TABLES } from "@/lib/aws/tables";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import type { User } from "@/types";

export default async function AdminUsuariosPage() {
  const res = await ddb.send(new ScanCommand({ TableName: TABLES.USERS }));
  const users = (res.Items as User[]) ?? [];
  users.sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground mt-1">
          {users.length} usuarios registrados, ordenados por puntos.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Jugador</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Rol</th>
                <th className="px-3 py-3 text-right">Puntos</th>
                <th className="px-3 py-3 text-right">Racha</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr
                  key={u.userId}
                  className="border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <td className="px-3 py-3 font-mono text-xs tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        {u.avatarUrl && (
                          <AvatarImage src={u.avatarUrl} alt={u.displayName} />
                        )}
                        <AvatarFallback>
                          {getInitials(u.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {u.displayName}
                        <span className="text-muted-foreground">#{u.tag}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {u.email}
                  </td>
                  <td className="px-3 py-3">
                    {u.role === "ADMIN" ? (
                      <Badge variant="danger">ADMIN</Badge>
                    ) : (
                      <Badge variant="muted">PLAYER</Badge>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold">
                    {u.totalPoints.toLocaleString("es")}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {u.currentStreak} / {u.maxStreak}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
