import Link from "next/link";
import { Receipt } from "lucide-react";
import { expenseDetailRoute } from "@/constants/routes";
import type { GroupExpense } from "@/features/groups/types";
import { formatCurrency } from "@/features/dashboard/utils/format-currency";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface ExpenseCardProps {
  expense: GroupExpense;
  className?: string;
}

export function ExpenseCard({ expense, className }: ExpenseCardProps) {
  return (
    <Link
      href={expenseDetailRoute(expense.id)}
      className={cn(
        "flex min-h-[4rem] items-center gap-3 rounded-xl border border-border/80 bg-card px-4 py-3 shadow-sm",
        "transition-colors hover:border-primary/25 hover:shadow-md active:bg-accent/30 active:scale-[0.99]",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none min-[375px]:px-4.5 min-[375px]:py-3.5",
        className,
      )}
    >
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
        aria-hidden="true"
      >
        <Receipt className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{expense.title}</p>
        <p className={cn("mt-1 truncate", META_TEXT_CLASS)}>
          <span className="text-foreground/85">{expense.paidBy} paid</span>
          <span className="mx-1 text-foreground/40" aria-hidden="true">
            ·
          </span>
          <span>{expense.date}</span>
          <span className="mx-1 text-foreground/40" aria-hidden="true">
            ·
          </span>
          <span>split {expense.splitCount} ways</span>
        </p>
      </div>

      <p className="shrink-0 text-sm font-bold tabular-nums text-foreground">
        {formatCurrency(expense.amount)}
      </p>
    </Link>
  );
}
