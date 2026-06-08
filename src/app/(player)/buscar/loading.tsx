import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
