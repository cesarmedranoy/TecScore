/**
 * Dashboard principal del jugador — sección "Principal".
 *
 * Layout denso:
 *  1. Hero compacto (saludo + CTA si no tiene grupos)
 *  2. Stats rápidos (4 cards)
 *  3. Próximos partidos a predecir (3 partidos)
 *  4. Mis grupos preview (3 cards)
 *  5. Reglas de puntuación (5 cards)
 *  6. Reglas del jugador
 *
 * El usuario pidió expresamente menos espacio vacío y más contenido útil.
 */

import { redirect } from "next/navigation";
import Link from "next/link";
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
  ArrowRight,
  Calendar,
} from "lucide-react";
import { auth } from "@/auth";
import {
  userRepository,
  groupMemberRepository,
  predictionRepository,
  matchRepository,
  groupRepository,
} from "@/server/repositories";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchCard } from "../mis-apuestas/_components/match-card";
import { acceptsPredictions } from "@/lib/scoring/match-state";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user, memberships, predictions, allMatches] = await Promise.all([
    userRepository.getById(session.user.userId),
    groupMemberRepository.listByUser(session.user.userId),
    predictionRepository.listByUser(session.user.userId),
    matchRepository.listAll(),
  ]);

  const name = user?.displayName ?? "Jugador";
  const points = user?.totalPoints ?? 0;
  const streak = user?.currentStreak ?? 0;
  const maxStreak = user?.maxStreak ?? 0;
  const groupCount = memberships.length;
  const predictionCount = predictions.length;

  // Próximos partidos donde aún puede predecir
  const predictionsByMatch = new Map(predictions.map((p) => [p.matchId, p]));
  const now = new Date();
  const upcoming = allMatches
    .filter((m) => acceptsPredictions(m, now))
    .sort(
      (a, b) =>
        new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
    )
    .slice(0, 3);

  // Top 3 grupos del usuario
  const myGroups = await Promise.all(
    memberships.slice(0, 3).map((m) => groupRepository.getById(m.groupId)),
  );
  const validGroups = myGroups.filter((g) => g !== null);

  return (
    <div className="flex flex-col gap-6">
      {/* Hero compacto */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 p-6 text-white">
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute -left-12 -bottom-12 size-40 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5 max-w-2xl">
            <Badge className="self-start bg-white/15 text-white border-white/20 backdrop-blur-sm">
              Mundial 2026
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight">
              ¡Hola, {name}!
            </h1>
            <p className="text-emerald-100">
              {predictionCount === 0
                ? "Aún no tienes predicciones. Comienza con los próximos partidos."
                : `Llevas ${predictionCount} predicciones y ${points} puntos. ¡Sigue así!`}
            </p>
          </div>
          {groupCount === 0 && (
            <Button asChild variant="accent" className="shrink-0">
              <Link href="/mis-grupos">
                Crea tu primer grupo
                <ArrowRight />
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Stats rápidos */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Trophy}
          label="Puntos"
          value={points.toLocaleString("es-PE")}
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
          label="Grupos"
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

      {/* Próximos partidos */}
      {upcoming.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              Próximos partidos
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/mis-apuestas">
                Ver todos
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcoming.map((m) => (
              <MatchCard
                key={m.matchId}
                match={m}
                prediction={predictionsByMatch.get(m.matchId)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Mis grupos preview */}
      {validGroups.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Users className="size-5 text-primary" />
              Tus grupos
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/mis-grupos">
                Gestionar
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {validGroups.map((g) => (
              <Link
                key={g.groupId}
                href={`/mis-grupos/${g.groupId}`}
                className="group"
              >
                <Card
                  elevation="raised"
                  className="hover:border-primary/40 transition-colors h-full"
                >
                  <CardContent className="pt-4 pb-4 flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <h3 className="font-semibold truncate">{g.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {g.memberCount} / {g.maxMembers} miembros
                      </p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Reglas de puntuación */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">
            Cómo ganas puntos
          </h2>
          <p className="text-sm text-muted-foreground">
            Las 5 reglas oficiales del concurso.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <RuleCard
            icon={Crown}
            title="Resultado exacto"
            points={5}
            description="Acertaste el marcador exacto. La regla más jugosa."
            example="Predices 2-1 → termina 2-1"
          />
          <RuleCard
            icon={Medal}
            title="Ganador correcto"
            points={3}
            description="Acertaste qué equipo gana (o empate), aunque no el marcador."
            example="Predices 3-1 → termina 2-0"
          />
          <RuleCard
            icon={Award}
            title="Diferencia exacta"
            points={2}
            description="Acertaste por cuántos goles gana, aunque no el marcador."
            example="Predices 3-1 → termina 2-0"
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
            description="Predices más de 24h antes del kickoff."
            example="+1 punto adicional"
          />
          <RuleCard
            icon={Zap}
            title="Último minuto"
            points={0}
            description="Si predices <10 min antes, no se acepta."
            example="Cierre absoluto al minuto 10"
            disabled
          />
        </div>
      </section>

      {/* Reglas del jugador */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold tracking-tight">
          Reglas del jugador
        </h2>
        <Card>
          <CardContent className="pt-5 pb-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-sm">
            <UserRule>
              Puedes estar en hasta <strong>5 grupos</strong> al mismo tiempo.
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
              Si abandonas un grupo, pierdes tu posición — pero{" "}
              <strong>tus predicciones siguen vivas</strong>.
            </UserRule>
            <UserRule>
              Si un partido se <strong>cancela o suspende</strong>, las
              predicciones se reactivan al reprogramarse.
            </UserRule>
            <UserRule>
              Tu progreso se guarda automáticamente — entra cuando quieras.
            </UserRule>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ============================================================================
// Subcomponentes locales
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
    zinc: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  } as const;

  return (
    <Card elevation="raised">
      <CardContent className="pt-4 pb-4 flex items-center gap-3">
        <div
          className={cn(
            "size-10 rounded-lg flex items-center justify-center shrink-0",
            accents[accent],
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
            {label}
          </span>
          <span className="text-xl font-bold tabular-nums leading-tight">
            {value}
          </span>
          {sublabel && (
            <span className="text-[10px] text-muted-foreground">
              {sublabel}
            </span>
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
      <CardHeader className="p-4 pb-2 gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="size-4" />
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
        <CardTitle className="text-base mt-0.5">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="rounded-md bg-muted px-2.5 py-1.5 text-[11px] text-muted-foreground font-mono">
          {example}
        </div>
      </CardContent>
    </Card>
  );
}

function UserRule({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
      <span className="text-muted-foreground leading-snug">{children}</span>
    </div>
  );
}
