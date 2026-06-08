import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {[1, 2].map((sec) => (
        <div key={sec} className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24" />
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
        </div>
      ))}
    </div>
  );
}
