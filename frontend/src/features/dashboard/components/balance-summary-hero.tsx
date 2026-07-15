import type { BalanceSummary } from "@/features/dashboard/types";
import { formatCurrency } from "@/features/dashboard/utils/format-currency";
import { BalanceCard } from "@/features/dashboard/components/balance-card";
import { META_LABEL_CLASS, META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface BalanceSummaryHeroProps {
  balances: BalanceSummary;
  className?: string;
}

export function BalanceSummaryHero({ balances, className }: BalanceSummaryHeroProps) {
  const isPositive = balances.total >= 0;
  const netLabel = isPositive ? "you are owed overall" : "you owe overall";
  const oweShare =
    (balances.youOwe / (balances.youOwe + balances.youAreOwed)) * 100;

  return (
    <section
      aria-labelledby="balance-summary-heading"
      className={cn("flex flex-col gap-2.5 min-[375px]:gap-3", className)}
    >
      <h2 id="balance-summary-heading" className="sr-only">
        Balance summary
      </h2>

      <article
        className={cn(
          "rounded-xl border p-3 shadow-sm min-[375px]:rounded-2xl min-[375px]:p-4",
          isPositive
            ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/12 via-card to-primary/8"
            : "border-destructive/20 bg-gradient-to-br from-destructive/10 via-card to-primary/8",
        )}
      >
        <div className="flex items-start justify-between gap-2 min-[375px]:gap-3">
          <div className="min-w-0 flex-1">
            <p className={META_LABEL_CLASS}>Net balance</p>
            <p
              className={cn(
                "font-heading text-2xl font-bold leading-none tabular-nums min-[375px]:text-[1.75rem]",
                isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive",
              )}
            >
              {formatCurrency(balances.total)}
            </p>
            <p className={cn("mt-1", META_TEXT_CLASS)}>{netLabel}</p>
          </div>

          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg min-[375px]:size-10 min-[375px]:rounded-xl",
              isPositive
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/15 text-destructive",
            )}
          >
            <TrendingUp className="size-4 min-[375px]:size-5" aria-hidden="true" />
          </span>
        </div>

        <div className="mt-3 space-y-1 min-[375px]:mt-4 min-[375px]:space-y-1.5">
          <div className={cn("grid grid-cols-2 gap-1", META_TEXT_CLASS)}>
            <span className="truncate">
              <span className="min-[375px]:hidden">Owe </span>
              <span className="hidden min-[375px]:inline">You owe </span>
              {formatCurrency(balances.youOwe)}
            </span>
            <span className="truncate text-right">
              <span className="min-[375px]:hidden">Owed </span>
              <span className="hidden min-[375px]:inline">Owed </span>
              {formatCurrency(balances.youAreOwed)}
            </span>
          </div>
          <div className="flex h-1.5 overflow-hidden rounded-full bg-muted/80 min-[375px]:h-2">
            <div
              className="h-full rounded-l-full bg-destructive/70"
              style={{ width: `${oweShare}%` }}
              aria-hidden="true"
            />
            <div className="h-full flex-1 rounded-r-full bg-emerald-500/70" aria-hidden="true" />
          </div>
        </div>
      </article>

      <div className="grid grid-cols-2 gap-1.5 min-[375px]:gap-2">
        <BalanceCard type="owe" amount={balances.youOwe} />
        <BalanceCard type="owed" amount={balances.youAreOwed} />
      </div>
    </section>
  );
}
