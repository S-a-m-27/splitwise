"use client";

import Link from "next/link";
import { ChevronRight, Receipt, Users } from "lucide-react";
import { expenseDetailRoute } from "@/constants/routes";
import type { ExpenseListItem } from "@/features/expenses/types";
import { SplitSummary } from "@/features/expenses/components/split-summary";
import { useCurrency } from "@/hooks/use-currency";
import { META_TEXT_CLASS, META_TEXT_SUBTLE_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface ExpenseCardProps {
  expense: ExpenseListItem;
  className?: string;
}

export function ExpenseCard({ expense, className }: ExpenseCardProps) {
  const { formatMoney } = useCurrency();

  return (
    <Link
      href={expenseDetailRoute(expense.id)}
      className={cn(
        "flex min-h-11 w-full min-w-0 items-start gap-3 rounded-xl border border-border/80 bg-card p-3.5 text-left shadow-sm",
        "transition-all duration-150 active:scale-[0.99] min-[375px]:gap-3.5 min-[375px]:p-4",
        "hover:border-primary/20 hover:shadow-md",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
    >
      <span
        className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
        aria-hidden="true"
      >
        <Receipt className="size-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-bold text-foreground min-[375px]:text-[15px]">
            {expense.title}
          </p>
          <p className="shrink-0 text-sm font-bold tabular-nums text-foreground min-[375px]:text-[15px]">
            {formatMoney(expense.amount)}
          </p>
        </div>

        <p className={cn("mt-1.5 truncate", META_TEXT_CLASS)}>
          <span className="text-foreground/85">{expense.paidBy} paid</span>
          <span className="mx-1 text-foreground/40" aria-hidden="true">
            ·
          </span>
          <span>{expense.date}</span>
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5",
              META_TEXT_SUBTLE_CLASS,
            )}
          >
            <Users className="size-3 shrink-0" aria-hidden="true" />
            {expense.groupName}
          </span>
          <SplitSummary summary={expense.splitSummary} />
        </div>
      </div>

      <ChevronRight
        className="mt-1 size-4 shrink-0 text-muted-foreground/50"
        aria-hidden="true"
      />
    </Link>
  );
}
