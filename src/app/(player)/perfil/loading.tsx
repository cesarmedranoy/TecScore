import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Card elevation="glow">
        <CardContent className="pt-6 pb-6 flex items-center gap-6">
          <Skeleton className="size-24 rounded-full" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-7 w-48" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full max-w-md mt-2" />
          </div>
        </CardContent>
      </Card>
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-72 w-full rounded-lg" />
    </div>
  );
}
