import { Crown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ExpenseDetail } from "@/features/expenses/types";
import { formatExpenseAmount } from "@/features/expenses/utils/format-expense-amount";
import { META_LABEL_CLASS, META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface ExpenseDetailsCardProps {
  expense: ExpenseDetail;
  className?: string;
}

export function ExpenseDetailsCard({ expense, className }: ExpenseDetailsCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/80 bg-card p-4 shadow-sm min-[375px]:rounded-2xl min-[375px]:p-5",
        className,
      )}
      aria-labelledby="expense-details-heading"
    >
      <h3
        id="expense-details-heading"
        className="font-heading text-base font-bold text-foreground min-[375px]:text-lg"
      >
        Details
      </h3>

      <dl className="mt-4 grid gap-4">
        <div>
          <dt className={META_LABEL_CLASS}>Paid by</dt>
          <dd className={cn("mt-1", META_TEXT_CLASS)}>{expense.paidBy}</dd>
        </div>

        <div>
          <dt className={META_LABEL_CLASS}>Per person</dt>
          <dd className="mt-1 text-sm font-bold tabular-nums text-foreground min-[375px]:text-[15px]">
            {formatExpenseAmount(expense.perPersonAmount)}
          </dd>
        </div>

        <div>
          <dt className={META_LABEL_CLASS}>Created</dt>
          <dd className={cn("mt-1", META_TEXT_CLASS)}>{expense.createdAt}</dd>
        </div>

        {expense.notes && (
          <div>
            <dt className={META_LABEL_CLASS}>Notes</dt>
            <dd className={cn("mt-1 leading-relaxed", META_TEXT_CLASS)}>{expense.notes}</dd>
          </div>
        )}
      </dl>

      <div className="mt-5">
        <p className={META_LABEL_CLASS}>Participants</p>
        <ul className="mt-3 flex flex-col gap-2">
          {expense.participants.map((participant) => (
            <li
              key={participant.id}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2.5",
                participant.isPayer
                  ? "border-amber-500/25 bg-amber-500/5"
                  : "border-border/80 bg-muted/20",
              )}
            >
              <Avatar size="sm" className="size-9">
                <AvatarFallback className="text-xs font-semibold">
                  {participant.initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {participant.name}
                  {participant.isCurrentUser && (
                    <span className="ml-1.5 font-normal text-muted-foreground">(you)</span>
                  )}
                </p>
                {participant.isPayer && (
                  <p className={cn("mt-0.5 flex items-center gap-1 text-amber-700 dark:text-amber-400", META_TEXT_CLASS)}>
                    <Crown className="size-3 shrink-0" aria-hidden="true" />
                    Paid the bill
                  </p>
                )}
              </div>

              <p className="shrink-0 text-sm font-bold tabular-nums text-foreground">
                {formatExpenseAmount(participant.perPersonAmount)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
