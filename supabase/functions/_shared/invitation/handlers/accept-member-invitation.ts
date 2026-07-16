import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { acceptMemberInvitationRpc } from "../repository.ts";
import type { GroupInvitationRow } from "../types.ts";

export async function handleAcceptMemberInvitation(
  supabase: SupabaseClient,
  invitationId: string,
  acceptedVia: "email" | "application" | "share_link" = "application",
): Promise<{ invitation: GroupInvitationRow }> {
  const invitation = await acceptMemberInvitationRpc(supabase, invitationId, acceptedVia);
  return { invitation };
}
