/**
 * /ayuda — FAQ + tutorial.
 * Pensado para tarea del compañero en Fase 5.6.
 */

import { HelpCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FAQ = [
  {
    q: "¿Cuántos puntos puedo ganar por partido?",
    a: "Máximo 8: 5 por resultado exacto + 1 por predicción anticipada + 2 por bonus de racha (si corresponde).",
  },
  {
    q: "¿Hasta cuándo puedo predecir un partido?",
    a: "Hasta 10 minutos antes del kickoff. Después se cierra automáticamente.",
  },
  {
    q: "¿Qué pasa si me salgo de un grupo?",
    a: "Perdés tu posición en el ranking de ese grupo, pero tus predicciones siguen vivas. Podés volver con el código si es público.",
  },
  {
    q: "¿Qué es la racha?",
    a: "Cada 3 partidos consecutivos donde acertás el ganador, ganás +2 puntos extra como bonus.",
  },
  {
    q: "¿Por qué mi compañero es admin y yo no?",
    a: "El rol admin se asigna por una lista de correos autorizados. Si pensás que debería ser admin, contactá al administrador del sistema.",
  },
  {
    q: "¿Qué pasa si FIFA suspende un partido?",
    a: "Las predicciones se mantienen. Cuando FIFA reprograme el partido, podés ajustar tu predicción si querés.",
  },
];

export default function AyudaPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <HelpCircle className="size-7" />
          Ayuda
        </h1>
        <p className="text-muted-foreground mt-1">
          Las preguntas más frecuentes sobre TecScore.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FAQ.map((item) => (
          <Card key={item.q}>
            <CardHeader>
              <CardTitle className="text-base">{item.q}</CardTitle>
              <CardDescription className="text-sm">{item.a}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
