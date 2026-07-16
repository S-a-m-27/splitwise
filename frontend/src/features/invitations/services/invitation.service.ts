import { authService } from "@/features/auth/services/auth.service";
import { mapMemberInvitationRow, mapMemberInvitationRows } from "@/features/invitations/adapters/map-invitation";
import {
  assertInvitationIsActionable,
  assertNotSelfInvitation,
  assertValidInvitationEmail,
  assertNonEmptyDeliveryChannels,
  filterInvitationsByStatus,
  resolveDeliveryChannelsForInvitee,
} from "@/features/invitations/domain/invitation-rules";
import {
  INVITATION_KIND,
  type InvitationDeliveryChannel,
} from "@/features/invitations/constants/invitation.constants";
import {
  InvitationServiceError,
  getInvitationErrorMessage,
  normalizeInvitationError,
} from "@/features/invitations/errors/invitation.errors";
import type {
  AcceptMemberInvitationInput,
  CreateMemberInvitationInput,
  InvitationListFilters,
  MemberInvitation,
} from "@/features/invitations/types";
import {
  acceptMemberInvitationSchema,
  createMemberInvitationSchema,
  groupInvitationsFilterSchema,
  invitationIdSchema,
} from "@/features/invitations/validation/invitation.schema";
import { invitationEdgeTransport } from "@/features/invitations/transport/invitation-edge.transport";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { GroupInvitationRow } from "@/types/database.types";

export { getInvitationErrorMessage };

const MEMBER_INVITATION_SELECT = `
  id,
  group_id,
  kind,
  status,
  invite_code,
  invited_email,
  invited_user_id,
  created_by,
  expires_at,
  active,
  delivery_channels,
  accepted_via,
  created_at,
  updated_at,
  responded_at,
  last_reminder_sent_at,
  metadata
`;

async function requireUserId(): Promise<string> {
  const { user, error } = await authService.getCurrentUser();
  if (error || !user) {
    throw new InvitationServiceError(
      "NO_SESSION",
      "Your session has expired. Please sign in again.",
    );
  }
  return user.id;
}

function throwIfSupabaseError(error: { message: string; code?: string } | null): void {
  if (!error) return;
  const normalized = normalizeInvitationError(error);
  throw new InvitationServiceError(normalized.code, normalized.message);
}

/**
 * Thin client orchestrator.
 * Mutations → Edge Functions (business logic + email on server).
 * Reads → authenticated RPCs (interim; see docs/invitations/ARCHITECTURE.md).
 */
export const invitationService = {
  async findInvitation(invitationId: string): Promise<MemberInvitation | null> {
    await requireUserId();
    invitationIdSchema.parse({ invitationId });

    const supabase = createBrowserClient();
    const { data, error } = await supabase
      .from("group_invitations")
      .select(MEMBER_INVITATION_SELECT)
      .eq("id", invitationId)
      .eq("kind", INVITATION_KIND.MEMBER)
      .maybeSingle();

    throwIfSupabaseError(error);
    if (!data) return null;

    return mapMemberInvitationRow(data as GroupInvitationRow);
  },

  async createInvitation(input: CreateMemberInvitationInput): Promise<MemberInvitation> {
    const userId = await requireUserId();
    const parsed = createMemberInvitationSchema.parse(input);

    assertValidInvitationEmail(parsed.invitedEmail);
    const deliveryChannels = resolveDeliveryChannelsForInvitee(
      parsed.isRegistered ?? false,
      parsed.deliveryChannels as InvitationDeliveryChannel[] | undefined,
    );
    assertNonEmptyDeliveryChannels(deliveryChannels);
    assertNotSelfInvitation(userId, null, parsed.invitedEmail);

    const result = await invitationEdgeTransport.createMemberInvitation({
      groupId: parsed.groupId,
      invitedEmail: parsed.invitedEmail,
      deliveryChannels: [...deliveryChannels],
      expiresAt: parsed.expiresAt ?? null,
      metadata: parsed.metadata ?? {},
    });

    return mapMemberInvitationRow(result.invitation as GroupInvitationRow);
  },

  async acceptInvitation(input: AcceptMemberInvitationInput): Promise<MemberInvitation> {
    await requireUserId();
    const parsed = acceptMemberInvitationSchema.parse(input);

    const acceptedVia =
      parsed.acceptedVia === "email" || parsed.acceptedVia === "application"
        ? parsed.acceptedVia
        : "application";

    const result = await invitationEdgeTransport.acceptMemberInvitation(
      parsed.invitationId,
      acceptedVia,
    );

    return mapMemberInvitationRow(result.invitation as GroupInvitationRow);
  },

  async declineInvitation(invitationId: string): Promise<MemberInvitation> {
    await requireUserId();
    invitationIdSchema.parse({ invitationId });

    const result = await invitationEdgeTransport.declineMemberInvitation(invitationId);
    return mapMemberInvitationRow(result.invitation as GroupInvitationRow);
  },

  async cancelInvitation(invitationId: string): Promise<MemberInvitation> {
    await requireUserId();
    invitationIdSchema.parse({ invitationId });

    const result = await invitationEdgeTransport.cancelMemberInvitation(invitationId);
    return mapMemberInvitationRow(result.invitation as GroupInvitationRow);
  },

  async expireInvitation(invitationId: string): Promise<MemberInvitation> {
    await requireUserId();
    invitationIdSchema.parse({ invitationId });

    const supabase = createBrowserClient();
    const { data, error } = await supabase.rpc("expire_member_invitation", {
      p_invitation_id: invitationId,
    });

    throwIfSupabaseError(error);
    if (!data) {
      throw new InvitationServiceError("UNKNOWN", "Failed to expire invitation.");
    }

    return mapMemberInvitationRow(data as GroupInvitationRow);
  },

  async getPendingInvitations(): Promise<MemberInvitation[]> {
    await requireUserId();

    const supabase = createBrowserClient();
    const { data, error } = await supabase.rpc("get_pending_member_invitations");

    throwIfSupabaseError(error);
    return mapMemberInvitationRows((data ?? []) as GroupInvitationRow[]);
  },

  async getGroupInvitations(
    filters: InvitationListFilters & { groupId: string },
  ): Promise<MemberInvitation[]> {
    await requireUserId();
    const parsed = groupInvitationsFilterSchema.parse(filters);

    const supabase = createBrowserClient();
    const { data, error } = await supabase.rpc("get_group_member_invitations", {
      p_group_id: parsed.groupId,
    });

    throwIfSupabaseError(error);
    const invitations = mapMemberInvitationRows((data ?? []) as GroupInvitationRow[]);
    return filterInvitationsByStatus(invitations, parsed.status);
  },

  async validateInvitation(invitationId: string): Promise<MemberInvitation> {
    const invitation = await this.findInvitation(invitationId);

    if (!invitation) {
      throw new InvitationServiceError("NOT_FOUND", "Invitation not found.");
    }

    assertInvitationIsActionable(invitation);
    return invitation;
  },

  async searchCandidates(groupId: string, query: string) {
    await requireUserId();
    const supabase = createBrowserClient();
    const { data, error } = await supabase.rpc("search_invite_candidates", {
      p_group_id: groupId,
      p_query: query.trim(),
    });
    throwIfSupabaseError(error);
    return data ?? [];
  },

  async isEmailRegistered(email: string): Promise<boolean> {
    await requireUserId();
    const supabase = createBrowserClient();
    const { data, error } = await supabase.rpc("is_email_registered", {
      p_email: email.trim().toLowerCase(),
    });
    throwIfSupabaseError(error);
    return Boolean(data);
  },

  async getReceivedInvitations(): Promise<MemberInvitation[]> {
    await requireUserId();

    const supabase = createBrowserClient();
    const { data, error } = await supabase.rpc("get_received_member_invitations");

    throwIfSupabaseError(error);
    return mapMemberInvitationRows((data ?? []) as GroupInvitationRow[]);
  },

  async getReceivedInvitationsWithContext(): Promise<MemberInvitation[]> {
    return this.getReceivedInvitations();
  },
};
