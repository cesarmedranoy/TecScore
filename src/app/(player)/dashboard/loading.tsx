import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <Skeleton className="h-32 w-full rounded-2xl" />
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} elevation="raised">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex flex-col gap-1 flex-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Section: próximos partidos */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-lg" />
          ))}
        </div>
      </div>
      {/* Section: reglas */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
