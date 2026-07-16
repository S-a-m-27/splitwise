import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  label: string;
  className?: string;
}

export function TypingIndicator({ label, className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-1 py-2 text-xs text-muted-foreground",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="flex gap-1" aria-hidden="true">
        <span className="size-1.5 animate-pulse rounded-full bg-current" />
        <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
        <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
      </span>
      <span>{label}</span>
    </div>
  );
}
