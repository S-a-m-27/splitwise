"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { dashboardKeys } from "@/features/dashboard/constants/query-keys";
import { expensesKeys } from "@/features/expenses/constants/query-keys";
import { groupsKeys } from "@/features/groups/constants/query-keys";
import { PROFILE_STALE_TIME_MS } from "@/features/profile/constants/query-config";
import { profileKeys } from "@/features/profile/constants/query-keys";
import {
  getProfileErrorMessage,
  isProfileSessionError,
} from "@/features/profile/services/profile.errors";
import { profileService } from "@/features/profile/services/profile.service";
import type { PasswordFormValues, ProfileFormValues } from "@/features/profile/types";

function useProfileAuth() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  return { userId: user?.id, isAuthenticated, authLoading };
}

function invalidateProfileQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
) {
  void queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
  void queryClient.invalidateQueries({ queryKey: profileKeys.stats(userId) });
  void queryClient.invalidateQueries({ queryKey: dashboardKeys.detail(userId) });
  void queryClient.invalidateQueries({ queryKey: groupsKeys.all });
  void queryClient.invalidateQueries({ queryKey: expensesKeys.list(userId) });
}

/** Authenticated user's profile view data. */
export function useProfile() {
  const { userId, isAuthenticated, authLoading } = useProfileAuth();

  const query = useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: () => profileService.getProfileView(),
    enabled: isAuthenticated && !!userId && !authLoading,
    staleTime: PROFILE_STALE_TIME_MS,
  });

  return {
    data: query.data,
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    error: query.error,
    errorMessage: query.error ? getProfileErrorMessage(query.error) : null,
    isSessionError: query.error ? isProfileSessionError(query.error) : false,
    refetch: query.refetch,
  };
}

/** Aggregated profile statistics for the stats cards. */
export function useProfileStats() {
  const { userId, isAuthenticated, authLoading } = useProfileAuth();

  const query = useQuery({
    queryKey: profileKeys.stats(userId),
    queryFn: () => profileService.getProfileStats(),
    enabled: isAuthenticated && !!userId && !authLoading,
    staleTime: PROFILE_STALE_TIME_MS,
  });

  return {
    data: query.data,
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    error: query.error,
    errorMessage: query.error ? getProfileErrorMessage(query.error) : null,
    isSessionError: query.error ? isProfileSessionError(query.error) : false,
    refetch: query.refetch,
  };
}

/** Updates the user's display name. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { userId } = useProfileAuth();

  return useMutation({
    mutationFn: (values: ProfileFormValues) =>
      profileService.updateProfile({ fullName: values.fullName }),
    onSuccess: async () => {
      const { user, setProfile } = useAuthStore.getState();

      if (user) {
        const profile = await authService.getProfile(user.id);
        setProfile(profile);
      }

      invalidateProfileQueries(queryClient, userId);
    },
  });
}

/** Changes the user's password after verifying the current one. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (values: PasswordFormValues) =>
      profileService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
  });
}
