"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Receipt } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import { SectionTitle } from "@/features/dashboard/components/section-title";
import { EmptyState } from "@/features/groups/components/empty-state";
import { SearchBar } from "@/features/groups/components/search-bar";
import { ExpenseCard } from "@/features/expenses/components/expense-card";
import { ExpensesFab } from "@/features/expenses/components/expenses-fab";
import { ExpensesListSkeleton } from "@/features/expenses/components/expenses-skeleton";
import { useExpenses } from "@/features/expenses/hooks/use-expenses";
import { filterExpenses } from "@/features/expenses/utils/filter-expenses";
import { LIST_STACK_CLASS, PageHeader, PageStack, SECTION_STACK_CLASS } from "@/components/layout/page-layout";

export function ExpensesPageContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const {
    data: expenses,
    isLoading,
    isError,
    errorMessage,
    isSessionError,
    refetch,
    isEmpty,
  } = useExpenses();

  useEffect(() => {
    if (isSessionError) {
      router.replace(ROUTES.login);
    }
  }, [isSessionError, router]);

  const filteredExpenses = useMemo(
    () => filterExpenses(expenses, searchQuery),
    [expenses, searchQuery],
  );

  const showNoResults = !isEmpty && filteredExpenses.length === 0;

  function handleFilterClick() {
    toast.info("Filters will be available in a future update.");
  }

  if (isError && expenses.length === 0) {
    return (
      <DashboardShell>
        <DashboardErrorState
          message={errorMessage ?? "Failed to load expenses."}
          onRetry={() => refetch()}
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageStack className="relative">
        <div className="aurora pointer-events-none absolute -top-4 right-0 left-0 h-28 opacity-40" aria-hidden="true" />

        <PageHeader
          title="Expenses"
          description="Track shared costs across your groups."
          className="relative"
        />

        {!isEmpty && !isLoading && (
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search expenses…"
            ariaLabel="Search expenses"
            onFilterClick={handleFilterClick}
          />
        )}

        <section aria-labelledby="expenses-list-heading" className={SECTION_STACK_CLASS}>
          <SectionTitle
            id="expenses-list-heading"
            title="Recent expenses"
            subtitle={
              isLoading || isEmpty
                ? undefined
                : `${filteredExpenses.length} of ${expenses.length} expenses`
            }
            className="mb-0"
          />

          {isLoading ? (
            <ExpensesListSkeleton />
          ) : isEmpty ? (
            <EmptyState
              title="No expenses yet"
              description="Add your first expense to start splitting costs with your group."
              actionLabel="Add expense"
              actionHref={ROUTES.expenseNew}
              icon={<Receipt className="size-6 text-primary" aria-hidden="true" />}
            />
          ) : showNoResults ? (
            <EmptyState
              title="No matching expenses"
              description="Try a different search term or add a new expense."
              actionLabel="Add expense"
              actionHref={ROUTES.expenseNew}
            />
          ) : (
            <ul className={LIST_STACK_CLASS}>
              {filteredExpenses.map((expense) => (
                <li key={expense.id}>
                  <ExpenseCard expense={expense} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageStack>

      {!isEmpty && !isLoading && <ExpensesFab />}
    </DashboardShell>
  );
}
