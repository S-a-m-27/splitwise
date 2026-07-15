import type { User as SupabaseUser } from "@supabase/supabase-js";
import { resolveDisplayName, type UserProfile } from "@/features/auth/types";
import type { DashboardUser } from "@/features/dashboard/types";
import { getGreeting } from "@/features/dashboard/utils/get-greeting";
import { getInitials } from "@/features/dashboard/utils/get-initials";

/** Maps auth profile + user to dashboard header user shape. */
export function mapAuthToDashboardUser(
  profile: UserProfile | null,
  user: SupabaseUser | null,
): DashboardUser | null {
  if (!user) return null;

  const name = resolveDisplayName(profile, user);
  return {
    name,
    greeting: getGreeting(),
    avatarUrl: profile?.avatarUrl,
    initials: getInitials(name),
  };
}
