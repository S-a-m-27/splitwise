import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function ProfileHeaderSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-6 min-[375px]:rounded-3xl min-[375px]:p-8">
      <div className="flex flex-col items-center">
        <Bone className="size-20 rounded-full min-[375px]:size-24" />
        <Bone className="mt-4 h-7 w-40" />
        <Bone className="mt-3 h-4 w-52" />
        <Bone className="mt-2 h-4 w-44" />
        <Bone className="mt-6 h-11 w-40 rounded-xl" />
      </div>
    </div>
  );
}

export function ProfileStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5 min-[375px]:gap-3 xl:grid-cols-3">
      <Bone className="h-24 rounded-xl min-[375px]:h-28" />
      <Bone className="h-24 rounded-xl min-[375px]:h-28" />
      <Bone className="col-span-2 h-24 rounded-xl min-[375px]:h-28 xl:col-span-1" />
      <Bone className="h-24 rounded-xl min-[375px]:h-28" />
      <Bone className="h-24 rounded-xl min-[375px]:h-28" />
    </div>
  );
}
