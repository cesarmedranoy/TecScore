/**
 * /admin/eliminatorias — vista admin del bracket.
 * Reutiliza la página pública pero con acciones de admin.
 *
 * Por ahora redirige a /admin/partidos con un filtro mental:
 * el admin crea cada partido del bracket desde ahí, eligiendo
 * el stage correspondiente (ROUND_OF_16, QUARTER_FINALS, etc.).
 */

import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import { matchRepository } from "@/server/repositories";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Stage } from "@/types";

const STAGES: { stage: Stage; label: string; expected: number }[] = [
  { stage: "ROUND_OF_16", label: "Octavos de final", expected: 8 },
  { stage: "QUARTER_FINALS", label: "Cuartos de final", expected: 4 },
  { stage: "SEMI_FINALS", label: "Semifinales", expected: 2 },
  { stage: "THIRD_PLACE", label: "Tercer puesto", expected: 1 },
  { stage: "FINAL", label: "Final", expected: 1 },
];

export default async function AdminEliminatoriasPage() {
  const all = await matchRepository.listAll();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Trophy className="size-7 text-amber-500" />
            Eliminatorias
          </h1>
          <p className="text-muted-foreground mt-1">
            Progreso del bracket. Para agregar partidos, andá a Partidos y
            seleccioná la etapa correspondiente.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/partidos">
            Ir a Partidos
            <ArrowRight />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STAGES.map(({ stage, label, expected }) => {
          const count = all.filter((m) => m.stage === stage).length;
          const finished = all.filter(
            (m) => m.stage === stage && m.status === "FINISHED",
          ).length;
          return (
            <Card key={stage} elevation="raised">
              <CardContent className="pt-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{label}</h3>
                  <Badge variant={count === expected ? "default" : "muted"}>
                    {count} / {expected}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Terminados: {finished}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all"
                    style={{ width: `${(count / expected) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
