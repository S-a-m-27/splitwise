"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { PageStack, PAGE_TITLE_CLASS } from "@/components/layout/page-layout";
import { ROUTES, expenseDetailRoute } from "@/constants/routes";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { ExpenseForm } from "@/features/expenses/components/expense-form";
import { ExpensesBackHeader } from "@/features/expenses/components/expenses-back-header";
import { useCreateExpense } from "@/features/expenses/hooks/use-expenses";
import { getExpensesErrorMessage } from "@/features/expenses/services/expenses.errors";
import type { ExpenseFormValues } from "@/features/expenses/types";
import { META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

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
      <PageStack className="relative">
        <div className="aurora pointer-events-none absolute -top-6 right-0 left-0 h-40 opacity-50" aria-hidden="true" />

        <ExpensesBackHeader
          title="Add expense"
          backHref={ROUTES.expenses}
          backLabel="Back to expenses"
        />

        <header className="relative flex flex-col gap-2">
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Smart split enabled
          </p>
          <h2 className={cn(PAGE_TITLE_CLASS, "text-gradient-primary")}>
            Split it fairly, instantly
          </h2>
          <p className={cn("max-w-md leading-relaxed", META_TEXT_CLASS)}>
            Add what was spent, who paid, and who shares — we&apos;ll preview the split live as
            you go.
          </p>
        </header>

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
