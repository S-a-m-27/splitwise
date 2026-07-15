import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4 py-2" role="status" aria-label="Loading">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-full max-w-xs" />
      <div className="space-y-3 pt-2">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
