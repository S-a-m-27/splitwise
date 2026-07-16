import { cn } from "@/lib/utils";

interface UnreadDividerProps {
  className?: string;
}

export function UnreadDivider({ className }: UnreadDividerProps) {
  return (
    <div
      className={cn("relative flex items-center py-3", className)}
      role="separator"
      aria-label="Unread messages"
    >
      <div className="h-px flex-1 bg-primary/30" aria-hidden="true" />
      <span className="mx-3 shrink-0 text-[10px] font-bold uppercase tracking-wider text-primary min-[375px]:text-[11px]">
        New messages
      </span>
      <div className="h-px flex-1 bg-primary/30" aria-hidden="true" />
    </div>
  );
}
