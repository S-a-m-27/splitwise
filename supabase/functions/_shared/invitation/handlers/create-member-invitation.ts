/**
 * Step 1 — Invite Registered User
 * Step 2 — branches to registration email when invited_user_id is null
 *
 * See docs/invitations/PHASE3_EXECUTION.md
 */
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { createEmailProvider } from "../../email/index.ts";
import {
  createMemberInvitationRpc,
  fetchGroupContext,
  fetchInviterName,
} from "../repository.ts";
import type {
  CreateMemberInvitationPayload,
  CreateMemberInvitationResult,
} from "../types.ts";

function buildAppUrl(): string {
  return Deno.env.get("APP_URL") ?? Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";
}

export async function handleCreateMemberInvitation(
  supabase: SupabaseClient,
  callerId: string,
  payload: CreateMemberInvitationPayload,
): Promise<CreateMemberInvitationResult> {
  const invitation = await createMemberInvitationRpc(supabase, payload);
  const [{ groupName }, inviterName] = await Promise.all([
    fetchGroupContext(supabase, invitation.group_id),
    fetchInviterName(supabase, callerId),
  ]);

  const appUrl = buildAppUrl();
  const inviteeType = invitation.invited_user_id ? "registered" : "unregistered";
  const channels = invitation.delivery_channels ?? [];
  const shouldSendEmail = channels.includes("email");

  let emailSent = false;
  let emailSkippedReason: string | undefined;

  if (!shouldSendEmail) {
    emailSkippedReason = "email channel not requested";
  } else {
    const emailProvider = createEmailProvider();
    const emailPayload = {
      invitationId: invitation.id,
      groupId: invitation.group_id,
      groupName,
      invitedEmail: invitation.invited_email ?? payload.invitedEmail,
      inviterName,
      inviteCode: invitation.invite_code,
      inviteUrl: invitation.invite_code
        ? `${appUrl}/invitations/${invitation.id}?via=email`
        : null,
      registerUrl: `${appUrl}/register?email=${encodeURIComponent(payload.invitedEmail)}&redirect=${encodeURIComponent(`/invitations/${invitation.id}`)}`,
      expiresAt: invitation.expires_at,
    };

    const result =
      inviteeType === "registered"
        ? await emailProvider.sendRegisteredInvite(emailPayload)
        : await emailProvider.sendRegistrationInvite(emailPayload);

    emailSent = result.success;
    if (!result.success) {
      emailSkippedReason = result.errorMessage ?? "email delivery failed";
      console.error("[invitations] email failed:", emailSkippedReason);
    }
  }

  return {
    invitation,
    emailSent,
    emailSkippedReason,
    inviteeType,
  };
}
