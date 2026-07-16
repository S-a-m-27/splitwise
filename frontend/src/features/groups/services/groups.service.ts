import { APP_CONFIG } from "@/constants/config";
import { authService } from "@/features/auth/services/auth.service";
import {
  GroupsServiceError,
  normalizeGroupsError,
} from "@/features/groups/services/groups.errors";
import type {
  CreateGroupFormValues,
  EditGroupFormValues,
  GroupDetail,
  GroupListItem,
  GroupMember,
} from "@/features/groups/types";
import {
  addMemberByEmailSchema,
  addMemberByNameSchema,
  createGroupSchema,
  editGroupSchema,
  inviteCodeSchema,
} from "@/features/groups/validation/groups.schema";
import {
  mapGroupDetail,
  mapGroupListItem,
  mapGroupMember,
} from "@/features/groups/utils/map-group";
import { buildInviteUrl } from "@/lib/safe-redirect";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { GroupMemberRole } from "@/types/database.types";

export { getGroupsErrorMessage } from "@/features/groups/services/groups.errors";

const GROUP_LIST_SELECT = `
  id,
  name,
  description,
  icon,
  type,
  invite_code,
  created_by,
  created_at,
  updated_at,
  group_members(count),
  group_guests(count)
`;

const GROUP_DETAIL_SELECT = `
  id,
  name,
  description,
  icon,
  type,
  invite_code,
  created_by,
  created_at,
  updated_at,
  group_members(
    id,
    user_id,
    role,
    joined_at,
    profiles(id, full_name, avatar_url)
  ),
  group_guests(
    id,
    display_name,
    created_at
  )
`;

interface InviteResult {
  inviteCode: string;
  inviteLink: string;
}

async function requireUserId(): Promise<string> {
  const { user, error } = await authService.getCurrentUser();

  if (error || !user) {
    throw new GroupsServiceError(
      "NO_SESSION",
      "Your session has expired. Please sign in again.",
    );
  }

  return user.id;
}

function throwIfSupabaseError(error: { message: string; code?: string } | null): void {
  if (!error) return;
  const normalized = normalizeGroupsError(error);
  throw new GroupsServiceError(normalized.code, normalized.message);
}

async function resolveInviteCode(groupId: string): Promise<string> {
  const supabase = createBrowserClient();

  // Share-link rows only — member invitations also live in this table.
  const { data: shareInvitation, error: shareError } = await supabase
    .from("group_invitations")
    .select("invite_code")
    .eq("group_id", groupId)
    .eq("kind", "share_link")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (shareError) throwIfSupabaseError(shareError);
  if (shareInvitation?.invite_code) return shareInvitation.invite_code;

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("invite_code")
    .eq("id", groupId)
    .maybeSingle();

  if (groupError) throwIfSupabaseError(groupError);
  if (group?.invite_code) return group.invite_code;

  throw new GroupsServiceError("NOT_FOUND", "Group invite link is unavailable.");
}

export const groupsService = {
  async getGroups(): Promise<GroupListItem[]> {
    await requireUserId();
    const supabase = createBrowserClient();

    const { data, error } = await supabase
      .from("groups")
      .select(GROUP_LIST_SELECT)
      .order("updated_at", { ascending: false });

    if (error) throwIfSupabaseError(error);

    return (data ?? []).map((row) => mapGroupListItem(row));
  },

  async getGroup(groupId: string): Promise<GroupDetail> {
    const userId = await requireUserId();
    const supabase = createBrowserClient();

    const { data, error } = await supabase
      .from("groups")
      .select(GROUP_DETAIL_SELECT)
      .eq("id", groupId)
      .maybeSingle();

    if (error) throwIfSupabaseError(error);
    if (!data) {
      throw new GroupsServiceError("NOT_FOUND", "Group not found or you do not have access.");
    }

    const inviteCode = await resolveInviteCode(groupId);
    return mapGroupDetail(data, userId, inviteCode);
  },

  async createGroup(values: CreateGroupFormValues): Promise<GroupDetail> {
    await requireUserId();
    const parsed = createGroupSchema.safeParse(values);

    if (!parsed.success) {
      throw new GroupsServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid group data.",
      );
    }

    const supabase = createBrowserClient();
    const { data, error } = await supabase.rpc("create_group", {
      p_name: parsed.data.name,
      p_description: parsed.data.description || null,
      p_icon: parsed.data.icon,
      p_type: parsed.data.type,
    });

    if (error) throwIfSupabaseError(error);
    if (!data) {
      throw new GroupsServiceError("UNKNOWN", "Failed to create group.");
    }

    return this.getGroup(data.id);
  },

  async updateGroup(
    groupId: string,
    values: EditGroupFormValues,
  ): Promise<GroupDetail> {
    await requireUserId();
    const parsed = editGroupSchema.safeParse(values);

    if (!parsed.success) {
      throw new GroupsServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid group data.",
      );
    }

    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("groups")
      .update({
        name: parsed.data.name,
        description: parsed.data.description || null,
        icon: parsed.data.icon,
      })
      .eq("id", groupId);

    if (error) throwIfSupabaseError(error);

    return this.getGroup(groupId);
  },

  async deleteGroup(groupId: string): Promise<void> {
    await requireUserId();
    const supabase = createBrowserClient();

    const { error } = await supabase.from("groups").delete().eq("id", groupId);

    if (error) throwIfSupabaseError(error);
  },

  async leaveGroup(groupId: string): Promise<void> {
    const userId = await requireUserId();
    const supabase = createBrowserClient();

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (error) throwIfSupabaseError(error);
  },

  async joinGroup(inviteCode: string): Promise<string> {
    await requireUserId();
    const parsed = inviteCodeSchema.safeParse(inviteCode);

    if (!parsed.success) {
      throw new GroupsServiceError(
        "INVALID_INVITE",
        parsed.error.issues[0]?.message ?? "Invalid invite code.",
      );
    }

    const supabase = createBrowserClient();
    const { data, error } = await supabase.rpc("join_group_by_invite", {
      p_invite_code: parsed.data,
    });

    if (error) throwIfSupabaseError(error);
    if (!data) {
      throw new GroupsServiceError("UNKNOWN", "Failed to join group.");
    }

    return data;
  },

  async getInvite(groupId: string): Promise<InviteResult> {
    await requireUserId();
    const inviteCode = await resolveInviteCode(groupId);

    return {
      inviteCode,
      inviteLink: buildInviteUrl(inviteCode, APP_CONFIG.url),
    };
  },

  async generateInvite(groupId: string): Promise<InviteResult> {
    await requireUserId();
    const supabase = createBrowserClient();

    const { data, error } = await supabase.rpc("regenerate_group_invite", {
      p_group_id: groupId,
    });

    if (error) throwIfSupabaseError(error);
    if (!data) {
      throw new GroupsServiceError("UNKNOWN", "Failed to generate invite link.");
    }

    return {
      inviteCode: data,
      inviteLink: buildInviteUrl(data, APP_CONFIG.url),
    };
  },

  /**
   * Adds a registered user to the group by email. Owner only — no outbound email sent.
   */
  async addMemberByEmail(groupId: string, email: string): Promise<void> {
    await requireUserId();
    const parsed = addMemberByEmailSchema.safeParse({ email });

    if (!parsed.success) {
      throw new GroupsServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid email address.",
      );
    }

    const supabase = createBrowserClient();
    const { error } = await supabase.rpc("add_group_member_by_email", {
      p_group_id: groupId,
      p_email: parsed.data.email,
    });

    if (error) throwIfSupabaseError(error);
  },

  /** Adds a name-only guest to the group. Any group member may add guests. */
  async addGuestByName(groupId: string, name: string): Promise<string> {
    await requireUserId();
    const parsed = addMemberByNameSchema.safeParse({ name });

    if (!parsed.success) {
      throw new GroupsServiceError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid name.",
      );
    }

    const supabase = createBrowserClient();
    const { data, error } = await supabase.rpc("add_group_guest_by_name", {
      p_group_id: groupId,
      p_name: parsed.data.name,
    });

    if (error) throwIfSupabaseError(error);
    if (!data) {
      throw new GroupsServiceError("UNKNOWN", "Failed to add guest.");
    }

    return data;
  },

  async getMembers(groupId: string): Promise<GroupMember[]> {
    const userId = await requireUserId();
    const supabase = createBrowserClient();

    const { data, error } = await supabase
      .from("group_members")
      .select(
        `
        id,
        user_id,
        role,
        joined_at,
        profiles(id, full_name, avatar_url)
      `,
      )
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true });

    if (error) throwIfSupabaseError(error);

    return (data ?? []).map((member) => mapGroupMember(member, userId));
  },

  /** Returns the current user's role in a group, if they are a member. */
  async getMyRole(groupId: string): Promise<GroupMemberRole | null> {
    const userId = await requireUserId();
    const supabase = createBrowserClient();

    const { data, error } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throwIfSupabaseError(error);
    return data?.role ?? null;
  },
};
