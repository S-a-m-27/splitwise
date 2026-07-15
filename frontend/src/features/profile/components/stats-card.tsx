import type { LucideIcon } from "lucide-react";
import { META_LABEL_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  shortLabel?: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "positive" | "negative" | "neutral";
  className?: string;
}

const TONE_STYLES = {
  default: {
    border: "border-primary/20",
    gradient: "from-primary/10 via-card to-card",
    iconBg: "bg-primary/12",
    icon: "text-primary",
    value: "text-foreground",
  },
  positive: {
    border: "border-emerald-500/20",
    gradient: "from-emerald-500/10 via-card to-card",
    iconBg: "bg-emerald-500/12",
    icon: "text-emerald-600 dark:text-emerald-400",
    value: "text-emerald-700 dark:text-emerald-400",
  },
  negative: {
    border: "border-destructive/20",
    gradient: "from-destructive/8 via-card to-card",
    iconBg: "bg-destructive/12",
    icon: "text-destructive",
    value: "text-destructive",
  },
  neutral: {
    border: "border-border/80",
    gradient: "from-muted/40 via-card to-card",
    iconBg: "bg-muted",
    icon: "text-foreground/70",
    value: "text-foreground",
  },
} as const;

/** Compact statistic tile for account overview. */
export function StatsCard({
  label,
  shortLabel,
  value,
  icon: Icon,
  tone = "default",
  className,
}: StatsCardProps) {
  const styles = TONE_STYLES[tone];

  return (
    <article
      className={cn(
        "min-w-0 rounded-xl border bg-gradient-to-br p-4 shadow-sm min-[375px]:rounded-2xl min-[375px]:p-4.5",
        styles.border,
        styles.gradient,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={cn("truncate", META_LABEL_CLASS)}>
            <span className="min-[375px]:hidden">{shortLabel ?? label}</span>
            <span className="hidden min-[375px]:inline">{label}</span>
          </p>
          <p
            className={cn(
              "mt-1.5 truncate font-heading text-lg font-bold tabular-nums min-[375px]:text-xl",
              styles.value,
            )}
          >
            {value}
          </p>
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            styles.iconBg,
          )}
        >
          <Icon className={cn("size-4", styles.icon)} aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
