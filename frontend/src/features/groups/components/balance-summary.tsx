import type { GroupBalanceSummary } from "@/features/groups/types";
import { BalanceCard } from "@/features/dashboard/components/balance-card";
import { formatCurrency } from "@/features/dashboard/utils/format-currency";
import { META_LABEL_CLASS, META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

interface BalanceSummaryProps {
  balances: GroupBalanceSummary;
  className?: string;
}

/** Group-level balance summary — mirrors Splitwise group totals. */
export function BalanceSummary({ balances, className }: BalanceSummaryProps) {
  const isPositive = balances.total >= 0;
  const netLabel = isPositive ? "you are owed in this group" : "you owe in this group";
  const oweShare =
    balances.youOwe + balances.youAreOwed > 0
      ? (balances.youOwe / (balances.youOwe + balances.youAreOwed)) * 100
      : 50;

  return (
    <section
      aria-labelledby="group-balance-heading"
      className={cn("flex flex-col gap-2.5 min-[375px]:gap-3", className)}
    >
      <h2 id="group-balance-heading" className="sr-only">
        Group balance summary
      </h2>

      <article
        className={cn(
          "rounded-xl border p-3 shadow-sm min-[375px]:rounded-2xl min-[375px]:p-4",
          isPositive
            ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/12 via-card to-primary/8"
            : balances.total < 0
              ? "border-destructive/20 bg-gradient-to-br from-destructive/10 via-card to-primary/8"
              : "border-border/80 bg-card",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={META_LABEL_CLASS}>Your balance</p>
            <p
              className={cn(
                "font-heading text-2xl font-bold leading-none tabular-nums min-[375px]:text-[1.75rem]",
                isPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : balances.total < 0
                    ? "text-destructive"
                    : "text-muted-foreground",
              )}
            >
              {formatCurrency(balances.total)}
            </p>
            <p className={cn("mt-1", META_TEXT_CLASS)}>{netLabel}</p>
          </div>

          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              isPositive
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : balances.total < 0
                  ? "bg-destructive/15 text-destructive"
                  : "bg-muted text-muted-foreground",
            )}
          >
            <TrendingUp className="size-5" aria-hidden="true" />
          </span>
        </div>

        {balances.total !== 0 && (
          <div className="mt-3 space-y-1.5 min-[375px]:mt-4">
            <div className={cn("grid grid-cols-2 gap-1", META_TEXT_CLASS)}>
              <span>You owe {formatCurrency(balances.youOwe)}</span>
              <span className="text-right">Owed {formatCurrency(balances.youAreOwed)}</span>
            </div>
            <div className="flex h-2 overflow-hidden rounded-full bg-muted/80">
              <div
                className="h-full rounded-l-full bg-destructive/70"
                style={{ width: `${oweShare}%` }}
                aria-hidden="true"
              />
              <div
                className="h-full flex-1 rounded-r-full bg-emerald-500/70"
                aria-hidden="true"
              />
            </div>
          </div>
        )}
      </article>

      <div className="grid grid-cols-2 gap-2">
        <BalanceCard type="owe" amount={balances.youOwe} />
        <BalanceCard type="owed" amount={balances.youAreOwed} />
      </div>
    </section>
  );
}
