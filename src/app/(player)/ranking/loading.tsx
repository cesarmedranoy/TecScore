import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Card>
        <CardContent className="pt-6 flex flex-col gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <Skeleton className="size-6" />
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 flex-1 max-w-xs" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
