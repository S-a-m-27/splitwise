"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface InvitationSkeletonProps {
  readonly variant?: "search" | "card" | "list";
  readonly count?: number;
  readonly className?: string;
}

function SearchResultSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
      <Skeleton className="size-11 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-9 w-20 shrink-0 rounded-xl" />
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm min-[375px]:p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="size-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-48" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

export function InvitationSkeleton({
  variant = "card",
  count = 3,
  className,
}: InvitationSkeletonProps) {
  const items = Array.from({ length: count });

  return (
    <div className={cn("flex flex-col gap-3", className)} aria-busy="true" aria-label="Loading">
      {items.map((_, index) => (
        <div key={index}>
          {variant === "search" && <SearchResultSkeleton />}
          {(variant === "card" || variant === "list") && <CardSkeleton />}
        </div>
      ))}
    </div>
  );
}
