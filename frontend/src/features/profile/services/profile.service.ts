import { authService } from "@/features/auth/services/auth.service";
import { mapProfileRow } from "@/features/auth/types";
import { balancesService } from "@/features/balances/services/balances.service";
import {
  ProfileServiceError,
  normalizeProfileError,
} from "@/features/profile/services/profile.errors";
import type { ProfileStats, ProfileUser } from "@/features/profile/types";
import {
  mapAuthToProfileUser,
  mapProfileStatsRow,
} from "@/features/profile/utils/map-profile";
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from "@/features/profile/validation/profile.schema";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export { getProfileErrorMessage } from "@/features/profile/services/profile.errors";

async function requireSession() {
  const { user, error } = await authService.getCurrentUser();

  if (error || !user) {
    throw new ProfileServiceError(
      "NO_SESSION",
      "Your session has expired. Please sign in again.",
    );
  }

  return user;
}

function throwIfSupabaseError(error: { message: string; code?: string } | null): void {
  if (!error) return;
  const normalized = normalizeProfileError(error);
  throw new ProfileServiceError(normalized.code, normalized.message);
}

export const profileService = {
  /** Loads the authenticated user's profile view for UI pages. */
  async getProfileView(): Promise<ProfileUser> {
    const user = await requireSession();
    const profile = await authService.getProfile(user.id);
    return mapAuthToProfileUser(profile, user);
  },

  /** Loads aggregated profile statistics from Supabase + balance engine. */
  async getProfileStats(): Promise<ProfileStats> {
    const user = await requireSession();
    const supabase = createBrowserClient();

    const [statsResult, balanceSnapshot] = await Promise.all([
      supabase.rpc("get_profile_stats"),
      balancesService.getBalanceSnapshot(user.id),
    ]);

    if (statsResult.error) throwIfSupabaseError(statsResult.error);

    const row = statsResult.data?.[0];

    if (!row) {
      throw new ProfileServiceError("NOT_FOUND", "Profile statistics could not be loaded.");
    }

    return mapProfileStatsRow(row, balanceSnapshot.balanceSummary);
  },

  /** Updates the user's display name in profiles and auth metadata. */
  async updateProfile(input: UpdateProfileInput): Promise<ProfileUser> {
    const parsed = updateProfileSchema.safeParse(input);

    if (!parsed.success) {
      throw new ProfileServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid profile data.",
      );
    }

    const user = await requireSession();
    const supabase = createBrowserClient();

    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name: parsed.data.fullName })
      .eq("id", user.id)
      .select("id, full_name, avatar_url, created_at, updated_at")
      .single();

    if (error) throwIfSupabaseError(error);

    if (!data) {
      throw new ProfileServiceError("NOT_FOUND", "Profile not found.");
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { full_name: parsed.data.fullName },
    });

    if (metadataError) {
      throw new ProfileServiceError(
        "SUPABASE_ERROR",
        metadataError.message || "Profile saved but account metadata could not be updated.",
      );
    }

    return mapAuthToProfileUser(mapProfileRow(data), user);
  },

  /** Verifies the current password and sets a new one via Supabase Auth. */
  async changePassword(input: ChangePasswordInput): Promise<void> {
    const parsed = changePasswordSchema.safeParse(input);

    if (!parsed.success) {
      throw new ProfileServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid password data.",
      );
    }

    const user = await requireSession();
    const email = user.email;

    if (!email) {
      throw new ProfileServiceError(
        "VALIDATION_ERROR",
        "Your account does not have an email address.",
      );
    }

    const supabase = createBrowserClient();

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.currentPassword,
    });

    if (verifyError) {
      throw new ProfileServiceError(
        "INVALID_PASSWORD",
        "Current password is incorrect.",
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.newPassword,
    });

    if (updateError) {
      const normalized = normalizeProfileError(updateError);
      throw new ProfileServiceError(normalized.code, normalized.message);
    }
  },
};
