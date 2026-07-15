import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function GroupCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex min-h-[4.75rem] items-center gap-3 rounded-xl border border-border/80 bg-card p-3.5",
        className,
      )}
    >
      <Skeleton className="size-11 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function GroupsListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <ul className="flex flex-col gap-2.5 min-[375px]:gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index}>
          <GroupCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

export function GroupDetailSkeleton() {
  return (
    <div className="flex flex-col gap-5 min-[375px]:gap-6">
      <div className="flex items-start gap-4">
        <Skeleton className="size-16 rounded-2xl" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-11 rounded-xl" />
        <Skeleton className="h-11 rounded-xl" />
      </div>
      <Skeleton className="h-11 rounded-xl" />
      <GroupsListSkeleton count={3} />
    </div>
  );
}
