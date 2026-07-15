"use client";

import { Calendar, Users } from "lucide-react";
import type { ExpenseDetail } from "@/features/expenses/types";
import { SplitSummary } from "@/features/expenses/components/split-summary";
import { useCurrency } from "@/hooks/use-currency";
import { META_LABEL_CLASS, META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface ExpenseHeaderProps {
  expense: ExpenseDetail;
  className?: string;
}

export function ExpenseHeader({ expense, className }: ExpenseHeaderProps) {
  const { formatMoney } = useCurrency();

  return (
    <header
      className={cn(
        "rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-4 shadow-sm min-[375px]:p-5 md:p-6",
        className,
      )}
    >
      <p className={META_LABEL_CLASS}>Expense</p>
      <h2 className="mt-1 font-heading text-xl font-bold text-foreground min-[375px]:text-2xl md:text-3xl">
        {expense.title}
      </h2>

      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-foreground min-[375px]:text-4xl">
        {formatMoney(expense.amount)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1",
            META_TEXT_CLASS,
          )}
        >
          <Users className="size-3.5 shrink-0" aria-hidden="true" />
          {expense.groupName}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1",
            META_TEXT_CLASS,
          )}
        >
          <Calendar className="size-3.5 shrink-0" aria-hidden="true" />
          {expense.date}
        </span>
        <SplitSummary summary={expense.splitSummary} />
      </div>
    </header>
  );
}
