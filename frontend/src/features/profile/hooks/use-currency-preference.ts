"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { activityKeys } from "@/features/activity/constants/query-keys";
import { balancesKeys } from "@/features/balances/constants/query-keys";
import { dashboardKeys } from "@/features/dashboard/constants/query-keys";
import { expensesKeys } from "@/features/expenses/constants/query-keys";
import { groupsKeys } from "@/features/groups/constants/query-keys";
import {
  getProfileErrorMessage,
} from "@/features/profile/services/profile.errors";
import { profileService } from "@/features/profile/services/profile.service";
import { settlementsKeys } from "@/features/settlements/constants/query-keys";
import { useCurrency } from "@/hooks/use-currency";
import {
  getCurrencyConfig,
  isCurrencyCode,
  type CurrencyCode,
} from "@/lib/currency";
import { useCurrencyStore } from "@/stores/currency-store";

function invalidateCurrencyQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
) {
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(userId) });
  void queryClient.invalidateQueries({ queryKey: groupsKeys.all });
  void queryClient.invalidateQueries({ queryKey: expensesKeys.all });
  void queryClient.invalidateQueries({ queryKey: settlementsKeys.all });
  void queryClient.invalidateQueries({ queryKey: activityKeys.all });
  void queryClient.invalidateQueries({ queryKey: balancesKeys.all });
}

/** Persists and applies the user's preferred display currency. */
export function useUpdatePreferredCurrency() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const setCurrencyCode = useCurrencyStore((state) => state.setCurrencyCode);
  const setProfile = useAuthStore((state) => state.setProfile);

  return useMutation({
    mutationFn: (currencyCode: CurrencyCode) =>
      profileService.updatePreferredCurrency({ currencyCode }),
    onMutate: async (currencyCode) => {
      const previousCode = useCurrencyStore.getState().currencyCode;
      setCurrencyCode(currencyCode);
      return { previousCode };
    },
    onSuccess: (profile) => {
      setProfile(profile);

      if (isCurrencyCode(profile.preferredCurrency)) {
        setCurrencyCode(profile.preferredCurrency);
      }

      invalidateCurrencyQueries(queryClient, userId);
      toast.success(`Currency set to ${getCurrencyConfig(profile.preferredCurrency).name}`);
    },
    onError: (error, _currencyCode, context) => {
      if (context?.previousCode) {
        setCurrencyCode(context.previousCode);
      }

      toast.error(getProfileErrorMessage(error));
    },
  });
}

/** Currency state plus update mutation for settings UI. */
export function useCurrencyPreference() {
  const currency = useCurrency();
  const updateCurrency = useUpdatePreferredCurrency();

  return {
    ...currency,
    updateCurrency: updateCurrency.mutate,
    isUpdating: updateCurrency.isPending,
  };
}
