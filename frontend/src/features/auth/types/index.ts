import type { User as SupabaseUser, Session as SupabaseSession } from "@supabase/supabase-js";
import type { Profile } from "@/types/database.types";

/** Application-level profile mapped from the profiles table. */
export interface UserProfile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  preferredCurrency: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: SupabaseUser | null;
  profile: UserProfile | null;
  session: SupabaseSession | null;
  isLoading: boolean;
}

export type AuthMode = "login" | "register";

/** Maps a database profile row to the application UserProfile type. */
export function mapProfileRow(row: Profile): UserProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url ?? undefined,
    preferredCurrency: row.preferred_currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Resolves display name from profile or auth user metadata. */
export function resolveDisplayName(
  profile: UserProfile | null,
  user: SupabaseUser | null,
): string {
  if (profile?.fullName) return profile.fullName;
  const meta = user?.user_metadata?.full_name ?? user?.user_metadata?.name;
  if (typeof meta === "string" && meta.trim()) return meta.trim();
  return user?.email?.split("@")[0] ?? "User";
}
