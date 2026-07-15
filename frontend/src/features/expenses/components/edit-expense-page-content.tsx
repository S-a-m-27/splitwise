"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageStack } from "@/components/layout/page-layout";
import { ROUTES, expenseDetailRoute } from "@/constants/routes";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import { EmptyState } from "@/features/groups/components/empty-state";
import { ExpenseForm } from "@/features/expenses/components/expense-form";
import { ExpensesBackHeader } from "@/features/expenses/components/expenses-back-header";
import { ExpensesListSkeleton } from "@/features/expenses/components/expenses-skeleton";
import { useExpense, useUpdateExpense } from "@/features/expenses/hooks/use-expenses";
import { getExpensesErrorMessage } from "@/features/expenses/services/expenses.errors";
import { expenseToFormValues } from "@/features/expenses/utils/map-expense";
import type { ExpenseFormValues } from "@/features/expenses/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface EditExpensePageContentProps {
  expenseId: string;
}

export function EditExpensePageContent({ expenseId }: EditExpensePageContentProps) {
  const router = useRouter();
  const { data: expense, isLoading, isError, errorMessage, isSessionError, refetch } =
    useExpense(expenseId);
  const updateExpense = useUpdateExpense(expenseId);

  useEffect(() => {
    if (isSessionError) {
      router.replace(ROUTES.login);
    }
  }, [isSessionError, router]);

  function handleSubmit(values: ExpenseFormValues) {
    updateExpense.mutate(values, {
      onSuccess: (updated) => {
        toast.success(`"${updated.title}" updated`);
        router.push(expenseDetailRoute(expenseId));
      },
      onError: (error) => toast.error(getExpensesErrorMessage(error)),
    });
  }

  if (isLoading) {
    return (
      <DashboardShell>
        <PageStack>
          <ExpensesBackHeader
            title="Edit expense"
            backHref={ROUTES.expenses}
            backLabel="Back to expenses"
          />
          <ExpensesListSkeleton count={2} />
        </PageStack>
      </DashboardShell>
    );
  }

  if (isError || !expense) {
    return (
      <DashboardShell>
        <PageStack>
          <ExpensesBackHeader
            title="Edit expense"
            backHref={ROUTES.expenses}
            backLabel="Back to expenses"
          />
          {isError ? (
            <DashboardErrorState
              message={errorMessage ?? "Failed to load expense."}
              onRetry={() => refetch()}
            />
          ) : (
            <EmptyState
              title="Expense not found"
              description="This expense may have been deleted or the link is invalid."
              actionLabel="View all expenses"
              actionHref={ROUTES.expenses}
            />
          )}
        </PageStack>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageStack>
        <ExpensesBackHeader
          title="Edit expense"
          backHref={expenseDetailRoute(expenseId)}
          backLabel="Back to expense details"
        />

        <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm min-[375px]:rounded-2xl min-[375px]:p-6 md:p-7">
          <p className={cn("mb-6 leading-relaxed", META_TEXT_CLASS)}>
            Update the details for this shared expense.
          </p>
          <ExpenseForm
            initialValues={expenseToFormValues(expense)}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
            isSubmitting={updateExpense.isPending}
            showHero={false}
          />
        </div>
      </PageStack>
    </DashboardShell>
  );
}
