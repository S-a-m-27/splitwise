import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import type { BalanceType } from "@/features/dashboard/types";
import { formatCurrency } from "@/features/dashboard/utils/format-currency";
import { META_LABEL_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  type: BalanceType;
  amount: number;
  className?: string;
}

const CONFIG: Record<
  BalanceType,
  {
    label: string;
    shortLabel: string;
    icon: typeof Wallet;
    amountClass: string;
    iconClass: string;
    bgClass: string;
    borderClass: string;
    gradientClass: string;
  }
> = {
  total: {
    label: "Total",
    shortLabel: "Total",
    icon: Wallet,
    amountClass: "text-foreground",
    iconClass: "text-primary",
    bgClass: "bg-primary/12",
    borderClass: "border-primary/20",
    gradientClass: "from-primary/10 via-card to-card",
  },
  owe: {
    label: "You owe",
    shortLabel: "Owe",
    icon: ArrowUpRight,
    amountClass: "text-destructive",
    iconClass: "text-destructive",
    bgClass: "bg-destructive/12",
    borderClass: "border-destructive/20",
    gradientClass: "from-destructive/8 via-card to-card",
  },
  owed: {
    label: "Owed to you",
    shortLabel: "Owed",
    icon: ArrowDownLeft,
    amountClass: "text-emerald-600 dark:text-emerald-400",
    iconClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-500/12",
    borderClass: "border-emerald-500/20",
    gradientClass: "from-emerald-500/8 via-card to-card",
  },
};

/** Half-width balance chip — readable at 320px. */
export function BalanceCard({ type, amount, className }: BalanceCardProps) {
  const {
    label,
    shortLabel,
    icon: Icon,
    amountClass,
    iconClass,
    bgClass,
    borderClass,
    gradientClass,
  } = CONFIG[type];
  const displayAmount =
    type === "total" ? formatCurrency(amount) : formatCurrency(Math.abs(amount));

  return (
    <article
      className={cn(
        "min-w-0 rounded-lg border bg-gradient-to-br p-2 shadow-sm min-[375px]:rounded-xl min-[375px]:p-3",
        borderClass,
        gradientClass,
        className,
      )}
    >
      <div className="flex items-center justify-between gap-1 min-[375px]:gap-2">
        <div className="min-w-0">
          <p className={cn("truncate", META_LABEL_CLASS)}>
            <span className="min-[375px]:hidden">{shortLabel}</span>
            <span className="hidden min-[375px]:inline">{label}</span>
          </p>
          <p
            className={cn(
              "truncate font-heading text-base font-bold tabular-nums min-[375px]:text-lg md:text-2xl",
              amountClass,
            )}
          >
            {displayAmount}
          </p>
        </div>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg min-[375px]:size-9 min-[375px]:rounded-xl md:size-11",
            bgClass,
          )}
        >
          <Icon className={cn("size-3.5 min-[375px]:size-4 md:size-5", iconClass)} aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}
