import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Card>
        <CardContent className="pt-16 pb-16 flex flex-col items-center gap-3">
          <Skeleton className="size-16 rounded-full" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardContent>
      </Card>
    </div>
  );
}
