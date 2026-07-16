import { authService } from "@/features/auth/services/auth.service";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export interface GroupActivityRow {
  readonly id: string;
  readonly group_id: string;
  readonly actor_user_id: string | null;
  readonly type: string;
  readonly invitation_id: string | null;
  readonly description: string;
  readonly metadata: Record<string, unknown>;
  readonly created_at: string;
}

async function requireUserId(): Promise<string> {
  const { user, error } = await authService.getCurrentUser();
  if (error || !user) {
    throw new Error("Not authenticated");
  }
  return user.id;
}

export const groupActivityService = {
  async getGroupActivities(groupId: string, limit = 50): Promise<GroupActivityRow[]> {
    await requireUserId();
    const supabase = createBrowserClient();
    const { data, error } = await supabase.rpc("get_group_activities", {
      p_group_id: groupId,
      p_limit: limit,
    });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as GroupActivityRow[];
  },
};
