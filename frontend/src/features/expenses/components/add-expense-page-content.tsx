"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PageStack } from "@/components/layout/page-layout";
import { ROUTES, expenseDetailRoute } from "@/constants/routes";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { ExpenseForm } from "@/features/expenses/components/expense-form";
import { ExpensesBackHeader } from "@/features/expenses/components/expenses-back-header";
import { useCreateExpense } from "@/features/expenses/hooks/use-expenses";
import { getExpensesErrorMessage } from "@/features/expenses/services/expenses.errors";
import type { ExpenseFormValues } from "@/features/expenses/types";

export function AddExpensePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetGroupId = searchParams.get("groupId") ?? undefined;
  const createExpense = useCreateExpense();

  function handleSubmit(values: ExpenseFormValues) {
    createExpense.mutate(values, {
      onSuccess: (expense) => {
        toast.success(`"${expense.title}" added`);
        router.push(expenseDetailRoute(expense.id));
      },
      onError: (error) => toast.error(getExpensesErrorMessage(error)),
    });
  }

  return (
    <DashboardShell>
      <PageStack>
        <ExpensesBackHeader
          title="Add expense"
          backHref={ROUTES.expenses}
          backLabel="Back to expenses"
          description="Enter the amount, who paid, and who shares. The split preview updates live."
        />

        <ExpenseForm
          onSubmit={handleSubmit}
          submitLabel="Save expense"
          isSubmitting={createExpense.isPending}
          presetGroupId={presetGroupId}
        />
      </PageStack>
    </DashboardShell>
  );
}
