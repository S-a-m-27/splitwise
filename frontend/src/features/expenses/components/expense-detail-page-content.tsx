"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { PageStack } from "@/components/layout/page-layout";
import { ROUTES, expenseEditRoute } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import { EmptyState } from "@/features/groups/components/empty-state";
import { DeleteDialog } from "@/features/expenses/components/delete-dialog";
import { ExpenseDetailsCard } from "@/features/expenses/components/expense-details-card";
import { ExpenseHeader } from "@/features/expenses/components/expense-header";
import { ExpensesBackHeader } from "@/features/expenses/components/expenses-back-header";
import { ExpensesListSkeleton } from "@/features/expenses/components/expenses-skeleton";
import { useDeleteExpense, useExpense } from "@/features/expenses/hooks/use-expenses";
import { getExpensesErrorMessage } from "@/features/expenses/services/expenses.errors";

interface ExpenseDetailPageContentProps {
  expenseId: string;
}

export function ExpenseDetailPageContent({ expenseId }: ExpenseDetailPageContentProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { data: expense, isLoading, isError, errorMessage, isSessionError, refetch } =
    useExpense(expenseId);
  const deleteExpense = useDeleteExpense();

  useEffect(() => {
    if (isSessionError) {
      router.replace(ROUTES.login);
    }
  }, [isSessionError, router]);

  if (isLoading) {
    return (
      <DashboardShell>
        <PageStack>
          <ExpensesBackHeader
            title="Expense details"
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
            title="Expense"
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
          title="Expense details"
          backHref={ROUTES.expenses}
          backLabel="Back to expenses"
          action={
            <Button
              render={<Link href={expenseEditRoute(expense.id)} />}
              variant="outline"
              size="icon"
              className="size-11"
              aria-label="Edit expense"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
          }
        />

        <ExpenseHeader expense={expense} />
        <ExpenseDetailsCard expense={expense} />

        <div className="flex flex-col gap-3 min-[375px]:flex-row">
          <Button
            render={<Link href={expenseEditRoute(expense.id)} />}
            className="h-11 flex-1"
          >
            <Pencil className="size-4" aria-hidden="true" />
            Edit expense
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
            disabled={deleteExpense.isPending}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </PageStack>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        expenseTitle={expense.title}
        onConfirm={() => {
          deleteExpense.mutate(
            { expenseId: expense.id, groupId: expense.groupId },
            {
              onSuccess: () => {
                toast.success(`"${expense.title}" deleted`);
                router.push(ROUTES.expenses);
              },
              onError: (error) => toast.error(getExpensesErrorMessage(error)),
            },
          );
        }}
      />
    </DashboardShell>
  );
}
