/**
 * Skeleton — placeholder animado durante cargas.
 * Usa el pulse de Tailwind. El color sale del token `--muted`.
 */

import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
