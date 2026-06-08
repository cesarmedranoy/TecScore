import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-10">
      <Skeleton className="h-32 w-full rounded-2xl" />
      {[1, 2, 3].map((sec) => (
        <div key={sec} className="flex flex-col gap-3">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
