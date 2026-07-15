import type { DebtBreakdownLine, DebtBreakdownLineType } from "@/features/settlements/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  HandCoins,
  Receipt,
  type LucideIcon,
} from "lucide-react";

const LINE_CONFIG: Record<
  DebtBreakdownLineType,
  {
    icon: LucideIcon;
    sign: "+" | "-";
    amountClass: string;
    iconClass: string;
    badgeClass: string;
    youOweLabel: string;
    owedToYouLabel: string;
  }
> = {
  expense_owed: {
    icon: Receipt,
    sign: "+",
    amountClass: "text-destructive",
    iconClass: "bg-destructive/10 text-destructive",
    badgeClass: "border-destructive/20 bg-destructive/5 text-destructive",
    youOweLabel: "Your share",
    owedToYouLabel: "Their share",
  },
  expense_credit: {
    icon: ArrowDownLeft,
    sign: "-",
    amountClass: "text-emerald-600 dark:text-emerald-400",
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    badgeClass: "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
    youOweLabel: "Their share",
    owedToYouLabel: "Your share",
  },
  settlement: {
    icon: HandCoins,
    sign: "-",
    amountClass: "text-primary",
    iconClass: "bg-primary/10 text-primary",
    badgeClass: "border-primary/20 bg-primary/5 text-primary",
    youOweLabel: "You paid",
    owedToYouLabel: "They paid you",
  },
  settlement_received: {
    icon: ArrowUpRight,
    sign: "+",
    amountClass: "text-amber-700 dark:text-amber-400",
    iconClass: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    badgeClass: "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400",
    youOweLabel: "They paid you",
    owedToYouLabel: "You paid them",
  },
};

interface DebtBreakdownLineItemProps {
  line: DebtBreakdownLine;
  direction?: "you_owe" | "owed_to_you";
  compact?: boolean;
}

export function DebtBreakdownLineItem({
  line,
  direction = "you_owe",
  compact = false,
}: DebtBreakdownLineItemProps) {
  const config = LINE_CONFIG[line.type];
  const Icon = config.icon;
  const badgeLabel =
    direction === "owed_to_you" ? config.owedToYouLabel : config.youOweLabel;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border/80 bg-background/80",
        compact ? "px-3 py-2.5" : "px-3.5 py-3 min-[375px]:px-4 min-[375px]:py-3.5",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          config.iconClass,
        )}
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{line.title}</p>
          <p className={cn("shrink-0 text-sm font-bold tabular-nums", config.amountClass)}>
            {config.sign}
            {line.amountLabel}
          </p>
        </div>

        <p className={cn("mt-0.5 line-clamp-2 leading-relaxed", META_TEXT_CLASS)}>
          {line.description}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              config.badgeClass,
            )}
          >
            {badgeLabel}
          </span>
          {line.dateLabel && (
            <span className={META_TEXT_CLASS}>{line.dateLabel}</span>
          )}
        </div>
      </div>
    </div>
  );
}
