import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ExpensesListSkeletonProps {
  count?: number;
  className?: string;
}

export function ExpensesListSkeleton({ count = 5, className }: ExpensesListSkeletonProps) {
  return (
    <ul className={cn("flex flex-col gap-2.5 min-[375px]:gap-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <li key={index}>
          <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-card p-3.5 min-[375px]:p-4">
            <Skeleton className="size-11 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="h-5 w-14 shrink-0" />
          </div>
        </li>
      ))}
    </ul>
  );
}
