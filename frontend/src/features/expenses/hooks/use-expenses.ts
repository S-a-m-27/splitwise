"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { activityKeys } from "@/features/activity/constants/query-keys";
import { balancesKeys } from "@/features/balances/constants/query-keys";
import { dashboardKeys } from "@/features/dashboard/constants/query-keys";
import { groupsKeys } from "@/features/groups/constants/query-keys";
import { settlementsKeys } from "@/features/settlements/constants/query-keys";
import { EXPENSES_STALE_TIME_MS } from "@/features/expenses/constants/query-config";
import { expensesKeys } from "@/features/expenses/constants/query-keys";
import {
  getExpensesErrorMessage,
  isExpensesSessionError,
} from "@/features/expenses/services/expenses.errors";
import { expensesService } from "@/features/expenses/services/expenses.service";
import type { ExpenseFormValues } from "@/features/expenses/types";

function useExpensesAuth() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  return { userId: user?.id, isAuthenticated, authLoading };
}

function invalidateExpenseQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
  expenseId?: string,
  groupId?: string,
) {
  void queryClient.invalidateQueries({ queryKey: expensesKeys.list(userId) });
  void queryClient.invalidateQueries({ queryKey: expensesKeys.list(userId, groupId) });
  void queryClient.invalidateQueries({ queryKey: balancesKeys.snapshot(userId) });
  void queryClient.invalidateQueries({ queryKey: activityKeys.feeds() });
  void queryClient.invalidateQueries({ queryKey: settlementsKeys.debts(userId) });
  void queryClient.invalidateQueries({ queryKey: settlementsKeys.list(userId) });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(userId) });

  if (expenseId) {
    void queryClient.invalidateQueries({
      queryKey: expensesKeys.detail(expenseId, userId),
    });
  }

  if (groupId) {
    void queryClient.invalidateQueries({
      queryKey: groupsKeys.detail(groupId, userId),
    });
  }
}

/** All expenses for the authenticated user, optionally filtered by group. */
export function useExpenses(groupId?: string) {
  const { userId, isAuthenticated, authLoading } = useExpensesAuth();

  const query = useQuery({
    queryKey: expensesKeys.list(userId, groupId),
    queryFn: () => expensesService.getExpenses(groupId),
    enabled: isAuthenticated && !!userId && !authLoading,
    staleTime: EXPENSES_STALE_TIME_MS,
  });

  return {
    data: query.data ?? [],
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    error: query.error,
    errorMessage: query.error ? getExpensesErrorMessage(query.error) : null,
    isSessionError: query.error ? isExpensesSessionError(query.error) : false,
    refetch: query.refetch,
    isEmpty: query.isSuccess && (query.data?.length ?? 0) === 0,
  };
}

/** Single expense detail. */
export function useExpense(expenseId: string) {
  const { userId, isAuthenticated, authLoading } = useExpensesAuth();

  const query = useQuery({
    queryKey: expensesKeys.detail(expenseId, userId),
    queryFn: () => expensesService.getExpense(expenseId),
    enabled: isAuthenticated && !!userId && !!expenseId && !authLoading,
    staleTime: EXPENSES_STALE_TIME_MS,
  });

  return {
    data: query.data,
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    error: query.error,
    errorMessage: query.error ? getExpensesErrorMessage(query.error) : null,
    isSessionError: query.error ? isExpensesSessionError(query.error) : false,
    refetch: query.refetch,
    isNotFound: query.isError && !query.isLoading,
  };
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { userId } = useExpensesAuth();

  return useMutation({
    mutationFn: (values: ExpenseFormValues) => expensesService.createExpense(values),
    onSuccess: (expense) =>
      invalidateExpenseQueries(queryClient, userId, expense.id, expense.groupId),
  });
}

export function useUpdateExpense(expenseId: string) {
  const queryClient = useQueryClient();
  const { userId } = useExpensesAuth();

  return useMutation({
    mutationFn: (values: ExpenseFormValues) =>
      expensesService.updateExpense(expenseId, values),
    onSuccess: (expense) =>
      invalidateExpenseQueries(queryClient, userId, expenseId, expense.groupId),
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { userId } = useExpensesAuth();

  return useMutation({
    mutationFn: ({
      expenseId,
      groupId,
    }: {
      expenseId: string;
      groupId?: string;
    }) => expensesService.deleteExpense(expenseId).then(() => ({ expenseId, groupId })),
    onSuccess: ({ expenseId, groupId }) =>
      invalidateExpenseQueries(queryClient, userId, expenseId, groupId),
  });
}
