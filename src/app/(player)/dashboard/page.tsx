/**
 * Dashboard principal del jugador — sección "Principal".
 *
 * Contenido:
 *  - Hero de bienvenida
 *  - Quick stats (puntos, racha, grupos, predicciones)
 *  - Reglas de puntuación (las 5)
 *  - Reglas del usuario (resumen del comportamiento esperado)
 *
 * TODO Fase 5.x: 3D carousel scroll arriba (tarea para compañero).
 */

import { redirect } from "next/navigation";
import {
  Trophy,
  Flame,
  Users,
  Target,
  Crown,
  Medal,
  Award,
  Clock,
  Zap,
} from "lucide-react";
import { auth } from "@/auth";
import {
  userRepository,
  groupMemberRepository,
  predictionRepository,
} from "@/server/repositories";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user, memberships, predictions] = await Promise.all([
    userRepository.getById(session.user.userId),
    groupMemberRepository.listByUser(session.user.userId),
    predictionRepository.listByUser(session.user.userId),
  ]);

  const name = user?.displayName ?? "Jugador";
  const points = user?.totalPoints ?? 0;
  const streak = user?.currentStreak ?? 0;
  const maxStreak = user?.maxStreak ?? 0;
  const groupCount = memberships.length;
  const predictionCount = predictions.length;

  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 p-8 text-white">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute -left-12 -bottom-12 size-48 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-3 max-w-2xl">
          <Badge className="self-start bg-white/15 text-white border-white/20 backdrop-blur-sm">
            Mundial 2026
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">
            ¡Bienvenido de vuelta, {name}!
          </h1>
          <p className="text-emerald-100 text-lg leading-relaxed">
            Predice los próximos partidos, mantené tu racha viva y subí en el
            ranking global.
          </p>
        </div>
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Trophy}
          label="Puntos totales"
          value={points.toLocaleString("es")}
          accent="amber"
        />
        <StatCard
          icon={Flame}
          label="Racha actual"
          value={`${streak}`}
          sublabel={`Récord: ${maxStreak}`}
          accent="orange"
        />
        <StatCard
          icon={Users}
          label="Mis grupos"
          value={`${groupCount} / 5`}
          accent="emerald"
        />
        <StatCard
          icon={Target}
          label="Predicciones"
          value={`${predictionCount}`}
          accent="zinc"
        />
      </section>

      {/* Reglas de puntuación */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Cómo ganás puntos
          </h2>
          <p className="text-muted-foreground">
            Las 5 reglas oficiales del concurso.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <RuleCard
            icon={Crown}
            title="Resultado exacto"
            points={5}
            description="Acertás el marcador exacto. La regla más jugosa."
            example="Predecís 2-1 → termina 2-1"
          />
          <RuleCard
            icon={Medal}
            title="Ganador correcto"
            points={3}
            description="Acertás qué equipo gana (o empate), aunque no el marcador."
            example="Predecís 3-1 → termina 2-0"
          />
          <RuleCard
            icon={Award}
            title="Diferencia exacta"
            points={2}
            description="Acertás por cuántos goles gana, aunque no el marcador."
            example="Predecís 3-1 → termina 2-0 (+2 al ganador)"
          />
          <RuleCard
            icon={Flame}
            title="Bonus por racha"
            points={2}
            bonus
            description="Por cada 3 aciertos seguidos del ganador, +2 pts extra."
            example="3 hits seguidos → +2 al 3°, +2 al 6°..."
          />
          <RuleCard
            icon={Clock}
            title="Predicción anticipada"
            points={1}
            bonus
            description="Predecís más de 24h antes del kickoff."
            example="Predicción válida: +1 punto adicional"
          />
          <RuleCard
            icon={Zap}
            title="Último minuto"
            points={0}
            description="Si predecís <10 min antes, no se acepta."
            example="Cierre absoluto al minuto 10"
            disabled
          />
        </div>
      </section>

      {/* Reglas de usuario */}
      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Reglas del jugador
          </h2>
          <p className="text-muted-foreground">
            Cosas que conviene tener claras.
          </p>
        </div>
        <Card>
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <UserRule>
              Podés estar en hasta <strong>5 grupos</strong> al mismo tiempo.
            </UserRule>
            <UserRule>
              Tu <strong>tag</strong> es único — identifica tu cuenta junto al
              nombre.
            </UserRule>
            <UserRule>
              Las predicciones <strong>se cierran 10 min antes</strong> del
              kickoff.
            </UserRule>
            <UserRule>
              Si abandonás un grupo, perdés tu posición en su ranking — pero{" "}
              <strong>tus predicciones siguen vivas</strong>.
            </UserRule>
            <UserRule>
              Si un partido se <strong>cancela o suspende</strong>, las
              predicciones se reactivan cuando FIFA agregue nueva fecha.
            </UserRule>
            <UserRule>
              Tu progreso se guarda automáticamente — entrá cuando quieras.
            </UserRule>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ============================================================================
// Subcomponentes locales (no se reusan fuera de este archivo)
// ============================================================================

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sublabel?: string;
  accent: "amber" | "orange" | "emerald" | "zinc";
}) {
  const accents = {
    amber:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    orange:
      "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    emerald:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    zinc:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  } as const;

  return (
    <Card elevation="raised">
      <CardContent className="pt-6 flex items-center gap-4">
        <div
          className={cn(
            "size-12 rounded-xl flex items-center justify-center",
            accents[accent],
          )}
        >
          <Icon className="size-6" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {label}
          </span>
          <span className="text-2xl font-bold tabular-nums">{value}</span>
          {sublabel && (
            <span className="text-xs text-muted-foreground">{sublabel}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function RuleCard({
  icon: Icon,
  title,
  points,
  description,
  example,
  bonus = false,
  disabled = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  points: number;
  description: string;
  example: string;
  bonus?: boolean;
  disabled?: boolean;
}) {
  return (
    <Card
      className={cn(disabled && "opacity-60")}
      elevation={bonus ? "glow" : "flat"}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="size-5" />
          </div>
          {points > 0 ? (
            <Badge variant={bonus ? "accent" : "default"}>
              {bonus ? "+" : ""}
              {points} pts
            </Badge>
          ) : (
            <Badge variant="muted">Bloqueado</Badge>
          )}
        </div>
        <CardTitle className="mt-1">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground font-mono">
          {example}
        </div>
      </CardContent>
    </Card>
  );
}

function UserRule({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
      <span className="text-muted-foreground leading-relaxed">{children}</span>
    </div>
  );
}
