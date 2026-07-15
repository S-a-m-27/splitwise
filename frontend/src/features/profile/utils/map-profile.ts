import type { User as SupabaseUser } from "@supabase/supabase-js";
import { resolveDisplayName, type UserProfile } from "@/features/auth/types";
import { getInitials } from "@/features/dashboard/utils/get-initials";
import type { ProfileStats, ProfileUser } from "@/features/profile/types";

function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Maps auth user + profile row to the profile page user shape. */
export function mapAuthToProfileUser(
  profile: UserProfile | null,
  user: SupabaseUser,
): ProfileUser {
  const fullName = resolveDisplayName(profile, user);

  return {
    id: user.id,
    fullName,
    email: user.email ?? "",
    memberSince: profile?.createdAt
      ? formatMemberSince(profile.createdAt)
      : "Recently joined",
    avatarUrl: profile?.avatarUrl,
    initials: getInitials(fullName),
  };
}

export function mapProfileStatsRow(
  row: {
    total_groups: number;
    total_expenses: number;
    total_paid: number;
  },
  balanceSummary: { youOwe: number; youAreOwed: number },
): ProfileStats {
  return {
    totalGroups: Number(row.total_groups),
    totalExpenses: Number(row.total_expenses),
    totalPaid: Number(row.total_paid),
    totalOwed: balanceSummary.youOwe,
    totalOwedToYou: balanceSummary.youAreOwed,
  };
}
