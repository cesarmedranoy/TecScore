/**
 * GET /api/users/search?q=...
 *
 * Busca usuarios por displayName o tag (case-insensitive, sin acentos).
 * Devuelve los primeros 20 resultados.
 *
 * Implementación: Scan + filtro en memoria. Para 5000+ usuarios habría
 * que mover a OpenSearch o GSI; para el MVP del Mundial alcanza.
 */

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { ddb } from "@/lib/aws/client";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { TABLES } from "@/lib/aws/tables";
import type { User } from "@/types";

const LIMIT = 20;
const MIN_QUERY_LENGTH = 2;

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ users: [] });
  }

  const needle = normalize(q.replace(/^#/, ""));
  const res = await ddb.send(new ScanCommand({ TableName: TABLES.USERS }));
  const all = (res.Items as User[]) ?? [];

  const matches = all
    .filter((u) => u.userId !== session.user.userId) 
    .filter((u) => u.role === "PLAYER") 
    .filter((u) => {
      const name = normalize(u.displayName);
      const tag = normalize(u.tag);
      const combined = normalize(`${u.displayName}#${u.tag}`);
      return (
        name.includes(needle) ||
        tag.includes(needle) ||
        combined.includes(needle)
      );
    })
    .slice(0, LIMIT)
    .map((u) => ({
      userId: u.userId,
      displayName: u.displayName,
      tag: u.tag,
      avatarUrl: u.avatarUrl,
      avatarPreset: u.avatarPreset ?? "google",
      customAvatarDataUrl: u.customAvatarDataUrl,
      totalPoints: u.totalPoints,
      currentStreak: u.currentStreak,
    }));

  return NextResponse.json({ users: matches });
}
