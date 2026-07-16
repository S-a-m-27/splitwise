import { formatMessageTime } from "@/features/chat/utils/format-chat-time";
import { cn } from "@/lib/utils";

interface DateSeparatorProps {
  label: string;
  className?: string;
}

export function DateSeparator({ label, className }: DateSeparatorProps) {
  return (
    <div
      className={cn("flex items-center justify-center py-4", className)}
      role="separator"
      aria-label={label}
    >
      <span className="rounded-full bg-muted/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground min-[375px]:text-xs">
        {label}
      </span>
    </div>
  );
}

interface MessageTimestampProps {
  iso: string;
  className?: string;
}

export function MessageTimestamp({ iso, className }: MessageTimestampProps) {
  return (
    <time
      dateTime={iso}
      className={cn(
        "mt-1 block text-[10px] text-muted-foreground/80 min-[375px]:text-[11px]",
        className,
      )}
    >
      {formatMessageTime(iso)}
    </time>
  );
}
