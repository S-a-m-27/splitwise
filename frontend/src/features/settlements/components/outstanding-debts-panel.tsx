import { CheckCircle2 } from "lucide-react";
import { LIST_STACK_CLASS } from "@/components/layout/page-layout";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import { EmptyState } from "@/features/groups/components/empty-state";
import { DebtCard } from "@/features/settlements/components/debt-card";
import type { OutstandingDebt } from "@/features/settlements/types";

interface OutstandingDebtsPanelProps {
  debts: readonly OutstandingDebt[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string | null;
  onRetry: () => void;
  onSettle: (debt: OutstandingDebt) => void;
  onViewReport: (debt: OutstandingDebt) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function OutstandingDebtsPanel({
  debts,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onSettle,
  onViewReport,
  emptyTitle = "All settled up",
  emptyDescription = "There are no outstanding balances to settle.",
}: OutstandingDebtsPanelProps) {
  const youOwe = debts.filter((debt) => debt.direction === "you_owe");
  const owedToYou = debts.filter((debt) => debt.direction === "owed_to_you");

  if (isLoading) {
    return (
      <ul className={LIST_STACK_CLASS} aria-label="Loading outstanding balances">
        {Array.from({ length: 2 }).map((_, index) => (
          <li
            key={index}
            className="h-32 animate-pulse rounded-2xl bg-muted"
            aria-hidden="true"
          />
        ))}
      </ul>
    );
  }

  if (isError) {
    return (
      <DashboardErrorState
        message={errorMessage ?? "Unable to load balances."}
        onRetry={onRetry}
      />
    );
  }

  if (debts.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={<CheckCircle2 className="size-6 text-emerald-600" aria-hidden="true" />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {youOwe.length > 0 && (
        <section aria-labelledby="you-owe-heading" className="flex flex-col gap-3">
          <h3
            id="you-owe-heading"
            className="text-xs font-bold uppercase tracking-wide text-destructive"
          >
            You owe
          </h3>
          {youOwe.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onSettle={onSettle}
              onViewReport={onViewReport}
            />
          ))}
        </section>
      )}

      {owedToYou.length > 0 && (
        <section aria-labelledby="owed-to-you-heading" className="flex flex-col gap-3">
          <h3
            id="owed-to-you-heading"
            className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400"
          >
            Owed to you
          </h3>
          {owedToYou.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onSettle={onSettle}
              onViewReport={onViewReport}
            />
          ))}
        </section>
      )}
    </div>
  );
}
