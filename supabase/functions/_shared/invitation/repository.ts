import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import type {
  CreateMemberInvitationPayload,
  GroupInvitationRow,
} from "./types.ts";

export async function createMemberInvitationRpc(
  supabase: SupabaseClient,
  payload: CreateMemberInvitationPayload,
): Promise<GroupInvitationRow> {
  const { data, error } = await supabase.rpc("create_member_invitation", {
    p_group_id: payload.groupId,
    p_invited_email: payload.invitedEmail,
    p_delivery_channels: payload.deliveryChannels ?? ["email", "in_app"],
    p_expires_at: payload.expiresAt ?? null,
    p_metadata: payload.metadata ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to create invitation.");
  }

  return data as GroupInvitationRow;
}

export async function cancelMemberInvitationRpc(
  supabase: SupabaseClient,
  invitationId: string,
): Promise<GroupInvitationRow> {
  const { data, error } = await supabase.rpc("cancel_member_invitation", {
    p_invitation_id: invitationId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to cancel invitation.");
  }

  return data as GroupInvitationRow;
}

export async function acceptMemberInvitationRpc(
  supabase: SupabaseClient,
  invitationId: string,
  acceptedVia: "email" | "application" | "share_link" = "application",
): Promise<GroupInvitationRow> {
  const { data, error } = await supabase.rpc("accept_member_invitation", {
    p_invitation_id: invitationId,
    p_accepted_via: acceptedVia,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to accept invitation.");
  }

  return data as GroupInvitationRow;
}

export async function declineMemberInvitationRpc(
  supabase: SupabaseClient,
  invitationId: string,
): Promise<GroupInvitationRow> {
  const { data, error } = await supabase.rpc("decline_member_invitation", {
    p_invitation_id: invitationId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to decline invitation.");
  }

  return data as GroupInvitationRow;
}

export async function fetchGroupContext(
  supabase: SupabaseClient,
  groupId: string,
): Promise<{ groupName: string; groupIcon: string }> {
  const { data, error } = await supabase
    .from("groups")
    .select("name, icon")
    .eq("id", groupId)
    .maybeSingle();

  if (error || !data) {
    return { groupName: "your group", groupIcon: "👥" };
  }

  return { groupName: data.name as string, groupIcon: data.icon as string };
}

export async function fetchInviterName(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  const name = data?.full_name as string | undefined;
  return name?.trim() || "Someone";
}
