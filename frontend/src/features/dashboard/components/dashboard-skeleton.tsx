import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function DashboardHeaderSkeleton() {
  return (
    <div className="mb-3 flex items-center gap-2.5 py-2">
      <Bone className="size-9 rounded-full min-[375px]:size-10" />
      <Bone className="h-4 flex-1 max-w-[10rem]" />
      <Bone className="size-10 rounded-xl min-[375px]:size-11" />
    </div>
  );
}

export function BalanceSummarySkeleton() {
  return (
    <div className="flex flex-col gap-2.5 min-[375px]:gap-3">
      <Bone className="h-36 rounded-xl min-[375px]:rounded-2xl" />
      <div className="grid grid-cols-2 gap-1.5 min-[375px]:gap-2">
        <Bone className="h-20 rounded-lg min-[375px]:rounded-xl" />
        <Bone className="h-20 rounded-lg min-[375px]:rounded-xl" />
      </div>
    </div>
  );
}

export function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-1.5 min-[375px]:gap-2">
      <Bone className="h-[4.75rem] rounded-lg min-[375px]:h-[5.5rem] min-[375px]:rounded-xl" />
      <Bone className="h-[4.75rem] rounded-lg min-[375px]:h-[5.5rem] min-[375px]:rounded-xl" />
      <Bone className="h-[4.75rem] rounded-lg min-[375px]:h-[5.5rem] min-[375px]:rounded-xl" />
    </div>
  );
}

export function GroupsPreviewSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="flex min-h-[4rem] items-center gap-3 border-b border-border/50 px-3 py-3">
        <Bone className="size-10 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-24" />
          <Bone className="h-3 w-32" />
        </div>
        <Bone className="h-6 w-12 rounded-full" />
      </div>
      <div className="flex min-h-[4rem] items-center gap-3 px-3 py-3">
        <Bone className="size-10 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Bone className="h-4 w-28" />
          <Bone className="h-3 w-36" />
        </div>
        <Bone className="h-6 w-12 rounded-full" />
      </div>
    </div>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <div className="flex flex-col">
      <Bone className="mx-3 my-3 h-12 rounded-lg min-[375px]:mx-4" />
      <Bone className="mx-3 my-3 h-12 rounded-lg min-[375px]:mx-4" />
      <Bone className="mx-3 my-3 h-12 rounded-lg min-[375px]:mx-4" />
    </div>
  );
}
