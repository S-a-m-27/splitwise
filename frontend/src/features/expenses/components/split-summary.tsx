import { Equal } from "lucide-react";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface SplitSummaryProps {
  summary?: string;
  participantCount?: number;
  variant?: "badge" | "card";
  className?: string;
}

export function SplitSummary({
  summary,
  participantCount,
  variant = "badge",
  className,
}: SplitSummaryProps) {
  const displayText =
    summary ??
    (participantCount
      ? `Equal split · ${participantCount} ${participantCount === 1 ? "person" : "people"}`
      : "Equal split");

  if (variant === "card") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/8 px-3 py-2",
          className,
        )}
      >
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Equal className="size-3.5" aria-hidden="true" />
        </span>
        <span className={cn("font-semibold text-primary", META_TEXT_CLASS)}>{displayText}</span>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-primary",
        META_TEXT_CLASS,
        className,
      )}
    >
      <Equal className="size-3 shrink-0" aria-hidden="true" />
      {displayText}
    </span>
  );
}
