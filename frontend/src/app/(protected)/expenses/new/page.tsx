import { Suspense } from "react";
import { createPageMetadata } from "@/app/metadata";
import { AddExpensePageContent } from "@/features/expenses/components/add-expense-page-content";
import { ExpensesListSkeleton } from "@/features/expenses/components/expenses-skeleton";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { ExpensesBackHeader } from "@/features/expenses/components/expenses-back-header";
import { ROUTES } from "@/constants/routes";

export const metadata = createPageMetadata(
  "Add Expense",
  "Record a new shared expense and split it with your group.",
);

export default function Page() {
  return (
    <Suspense
      fallback={
        <DashboardShell>
          <ExpensesBackHeader
            title="Add expense"
            backHref={ROUTES.expenses}
            backLabel="Back to expenses"
          />
          <ExpensesListSkeleton count={2} />
        </DashboardShell>
      }
    >
      <AddExpensePageContent />
    </Suspense>
  );
}
