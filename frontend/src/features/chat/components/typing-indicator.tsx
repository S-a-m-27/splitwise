import { cn } from "@/lib/utils";
import { MessageCircleMore } from "lucide-react";

interface TypingIndicatorProps {
  label: string;
  className?: string;
}

export function TypingIndicator({ label, className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-end gap-2.5 px-1 py-2",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={label}
    >
      <span
        className="relative flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15"
        aria-hidden="true"
      >
        <MessageCircleMore className="size-4" />
        <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-background bg-emerald-500" />
      </span>

      <span className="flex min-w-0 items-center gap-2.5 rounded-2xl rounded-bl-md border border-border/70 bg-card px-3.5 py-2.5 shadow-sm">
        <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
          <span className="size-1.5 animate-bounce rounded-full bg-primary/75 [animation-duration:900ms] motion-reduce:animate-none" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary/75 [animation-delay:150ms] [animation-duration:900ms] motion-reduce:animate-none" />
          <span className="size-1.5 animate-bounce rounded-full bg-primary/75 [animation-delay:300ms] [animation-duration:900ms] motion-reduce:animate-none" />
        </span>
        <span className="truncate text-xs font-medium text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}
