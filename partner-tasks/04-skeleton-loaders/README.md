# 04 — Skeleton loaders

## Qué hay que hacer

Crear un componente `Skeleton` y agregar `loading.tsx` en cada ruta del player
y admin. Cuando una página tarda en cargar (porque hace queries a DynamoDB),
el usuario ve un esqueleto animado en vez de pantalla blanca.

## Por qué

Mejora muchísimo la percepción de velocidad. Y es lo más fácil de notar al
profesor en una demo.

## Pasos sugeridos

### 1. Crear el primitivo

`src/components/ui/skeleton.tsx`:

```tsx
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className,
      )}
      {...props}
    />
  );
}
```

Si querés algo más fancy con shimmer, podés usar gradients animados (mirá
referencias de shadcn).

### 2. loading.tsx por ruta

Next.js renderiza automáticamente `loading.tsx` mientras la página se
suspende. Crear uno por sección importante:

- `src/app/(player)/dashboard/loading.tsx`
- `src/app/(player)/mis-grupos/loading.tsx`
- `src/app/(player)/mis-grupos/[groupId]/loading.tsx`
- `src/app/(player)/mis-apuestas/loading.tsx`
- `src/app/(player)/eliminatorias/loading.tsx`
- `src/app/(admin)/admin/loading.tsx`
- `src/app/(admin)/admin/partidos/loading.tsx`
- `src/app/(admin)/admin/usuarios/loading.tsx`

Cada uno replica la estructura visual de la página real, pero con `Skeleton`
en vez del contenido.

### Ejemplo para mis-grupos:

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6 flex flex-col gap-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

## Acceptance criteria

- [ ] Componente `Skeleton` con animación pulse
- [ ] `loading.tsx` para cada ruta crítica (dashboard, mis-grupos, mis-
      apuestas, eliminatorias, admin/*)
- [ ] Cada skeleton refleja visualmente la estructura de su página
- [ ] Probaste tirando el rate del DynamoDB local (Docker Throttling) para
      verificar que se vean

## Tips

- Para probar que aparecen, agregá un `await new Promise(r => setTimeout(r, 2000))`
  temporal en la página que estás verificando.
- Los skeletons deben tener proporciones similares al contenido real para
  evitar layout shift cuando termina de cargar.

## Esfuerzo

3-4 horas (mucho copy-paste con variaciones).
