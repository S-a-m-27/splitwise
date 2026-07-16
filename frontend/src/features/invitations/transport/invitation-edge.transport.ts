import { authService } from "@/features/auth/services/auth.service";
import {
  InvitationServiceError,
  normalizeInvitationError,
} from "@/features/invitations/errors/invitation.errors";
import {
  INVITATION_EDGE_FUNCTION,
  type CreateMemberInvitationEdgeResult,
  type EdgeInvokeResult,
} from "@/features/invitations/transport/types";
import type { InvitationAction } from "@/features/invitations/transport/types";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export type { InvitationAction } from "@/features/invitations/transport/types";

async function requireSession() {
  const { user, error } = await authService.getCurrentUser();
  if (error || !user) {
    throw new InvitationServiceError(
      "NO_SESSION",
      "Your session has expired. Please sign in again.",
    );
  }
  return user;
}

function parseEdgeError(error: { message: string } | null): never {
  if (!error) {
    throw new InvitationServiceError("UNKNOWN", "Edge function request failed.");
  }

  try {
    const parsed = JSON.parse(error.message) as { error?: string; code?: string };
    if (parsed.error) {
      const normalized = normalizeInvitationError({ message: parsed.error });
      throw new InvitationServiceError(normalized.code, parsed.error);
    }
  } catch (parseError) {
    if (parseError instanceof InvitationServiceError) throw parseError;
  }

  const normalized = normalizeInvitationError(error);
  throw new InvitationServiceError(normalized.code, normalized.message);
}

async function invokeInvitationAction<T>(
  action: InvitationAction,
  payload: Record<string, unknown>,
): Promise<T> {
  await requireSession();

  const supabase = createBrowserClient();
  const { data, error } = await supabase.functions.invoke(INVITATION_EDGE_FUNCTION, {
    body: { action, payload },
  });

  if (error) {
    parseEdgeError(error);
  }

  const result = data as EdgeInvokeResult<T> | null;
  if (!result?.ok) {
    throw new InvitationServiceError("UNKNOWN", "Invalid edge function response.");
  }

  return result.data;
}

/** Client transport — all invitation mutations go through Edge Functions. */
export const invitationEdgeTransport = {
  createMemberInvitation(
    payload: Record<string, unknown>,
  ): Promise<CreateMemberInvitationEdgeResult> {
    return invokeInvitationAction<CreateMemberInvitationEdgeResult>(
      "create_member_invitation",
      payload,
    );
  },

  acceptMemberInvitation(
    invitationId: string,
    acceptedVia?: "email" | "application",
  ): Promise<{ invitation: Record<string, unknown> }> {
    return invokeInvitationAction("accept_member_invitation", {
      invitationId,
      acceptedVia: acceptedVia ?? "application",
    });
  },

  declineMemberInvitation(invitationId: string): Promise<{ invitation: Record<string, unknown> }> {
    return invokeInvitationAction("decline_member_invitation", { invitationId });
  },

  cancelMemberInvitation(invitationId: string): Promise<{ invitation: Record<string, unknown> }> {
    return invokeInvitationAction("cancel_member_invitation", { invitationId });
  },
};
