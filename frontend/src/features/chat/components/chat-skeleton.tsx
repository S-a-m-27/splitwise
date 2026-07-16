import { Skeleton } from "@/components/ui/skeleton";
import { LIST_STACK_CLASS } from "@/components/layout/page-layout";
import { cn } from "@/lib/utils";

export function ConversationCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-card px-4 py-3 min-[375px]:rounded-2xl">
      <Skeleton className="size-12 shrink-0 rounded-full min-[375px]:size-[3.25rem]" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-3 w-full max-w-[14rem]" />
      </div>
    </div>
  );
}

export function ConversationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <ul className={LIST_STACK_CLASS}>
      {Array.from({ length: count }).map((_, index) => (
        <li key={index}>
          <ConversationCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

export function ChatHeaderSkeleton() {
  return (
    <div className="flex min-h-16 items-center gap-3 border-b border-border/80 px-4 py-2">
      <Skeleton className="size-11 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="size-10 rounded-xl" />
    </div>
  );
}

export function MessageBubbleSkeleton({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div
      className={cn(
        "flex",
        align === "right" ? "justify-end" : "items-end gap-2",
      )}
    >
      {align === "left" && <Skeleton className="size-8 shrink-0 rounded-full" />}
      <Skeleton
        className={cn(
          "h-12 rounded-2xl",
          align === "right" ? "w-48 rounded-br-md" : "w-56 rounded-bl-md",
        )}
      />
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <MessageBubbleSkeleton align="left" />
      <MessageBubbleSkeleton align="right" />
      <MessageBubbleSkeleton align="left" />
      <MessageBubbleSkeleton align="right" />
    </div>
  );
}

export function ChatScreenSkeleton() {
  return (
    <div className="flex h-full min-h-[24rem] flex-col overflow-hidden rounded-xl border border-border/80 bg-card min-[375px]:rounded-2xl">
      <ChatHeaderSkeleton />
      <MessageListSkeleton />
      <div className="border-t border-border/80 p-4">
        <Skeleton className="h-11 w-full rounded-2xl" />
      </div>
    </div>
  );
}
