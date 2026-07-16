import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { handleAcceptMemberInvitation } from "../_shared/invitation/handlers/accept-member-invitation.ts";
import { handleCreateMemberInvitation } from "../_shared/invitation/handlers/create-member-invitation.ts";
import { handleDeclineMemberInvitation } from "../_shared/invitation/handlers/decline-member-invitation.ts";
import { cancelMemberInvitationRpc } from "../_shared/invitation/repository.ts";
import type {
  CreateMemberInvitationPayload,
  InvitationRequestBody,
} from "../_shared/invitation/types.ts";
import {
  createUserClient,
  requireAuthenticatedUser,
} from "../_shared/supabase-user-client.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createUserClient(authHeader);
    const caller = await requireAuthenticatedUser(supabase);

    const body = (await req.json()) as InvitationRequestBody;
    const { action, payload = {} } = body;

    if (!action) {
      return errorResponse("Missing action", 400, "VALIDATION_ERROR");
    }

    switch (action) {
      case "create_member_invitation": {
        const input = payload as unknown as CreateMemberInvitationPayload;
        if (!input.groupId || !input.invitedEmail) {
          return errorResponse(
            "groupId and invitedEmail are required",
            400,
            "VALIDATION_ERROR",
          );
        }

        const result = await handleCreateMemberInvitation(
          supabase,
          caller.id,
          input,
        );

        return jsonResponse({ ok: true, action, data: result });
      }

      case "accept_member_invitation": {
        const invitationId = payload.invitationId as string | undefined;
        if (!invitationId) {
          return errorResponse("invitationId is required", 400, "VALIDATION_ERROR");
        }

        const acceptedVia = (payload.acceptedVia as "email" | "application" | undefined) ?? "application";
        const result = await handleAcceptMemberInvitation(
          supabase,
          invitationId,
          acceptedVia,
        );

        return jsonResponse({ ok: true, action, data: result });
      }

      case "decline_member_invitation": {
        const invitationId = payload.invitationId as string | undefined;
        if (!invitationId) {
          return errorResponse("invitationId is required", 400, "VALIDATION_ERROR");
        }

        const result = await handleDeclineMemberInvitation(supabase, invitationId);
        return jsonResponse({ ok: true, action, data: result });
      }

      case "cancel_member_invitation": {
        const invitationId = payload.invitationId as string | undefined;
        if (!invitationId) {
          return errorResponse("invitationId is required", 400, "VALIDATION_ERROR");
        }

        const invitation = await cancelMemberInvitationRpc(supabase, invitationId);
        return jsonResponse({ ok: true, action, data: { invitation } });
      }

      default:
        return errorResponse(`Unknown action: ${action}`, 400, "UNKNOWN_ACTION");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Not authenticated" ? 401 : 400;
    console.error("[invitations]", message);
    return errorResponse(message, status);
  }
});
