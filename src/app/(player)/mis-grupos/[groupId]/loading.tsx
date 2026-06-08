import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
