"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { PageStack } from "@/components/layout/page-layout";
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
      <PageStack className="relative gap-4 min-[375px]:gap-5">
        <div
          className="aurora pointer-events-none absolute -top-4 right-0 left-0 h-36 opacity-45"
          aria-hidden="true"
        />

        <ExpensesBackHeader
          title="Add expense"
          backHref={ROUTES.expenses}
          backLabel="Back to expenses"
          className="relative"
        />

        <section
          className={cn(
            "relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-4 shadow-sm",
            "min-[375px]:rounded-3xl min-[375px]:p-5",
          )}
          aria-label="Expense introduction"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -top-12 -right-8 size-32 rounded-full bg-primary/15 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col gap-3 min-[375px]:gap-3.5">
            <div className="flex items-center justify-between gap-3">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Smart split enabled
              </p>
              <span
                className="hidden size-9 items-center justify-center rounded-xl bg-primary/10 text-primary min-[375px]:flex"
                aria-hidden="true"
              >
                <Sparkles className="size-4" />
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <h2 className="font-heading text-xl font-bold leading-tight text-gradient-primary min-[375px]:text-2xl">
                Split it fairly, instantly
              </h2>
              <p className={cn("max-w-prose leading-relaxed", META_TEXT_CLASS)}>
                Add what was spent, who paid, and who shares — we&apos;ll preview the split live
                as you go.
              </p>
            </div>
          </div>
        </section>

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
