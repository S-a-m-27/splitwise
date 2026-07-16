import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { declineMemberInvitationRpc } from "../repository.ts";
import type { GroupInvitationRow } from "../types.ts";

export async function handleDeclineMemberInvitation(
  supabase: SupabaseClient,
  invitationId: string,
): Promise<{ invitation: GroupInvitationRow }> {
  const invitation = await declineMemberInvitationRpc(supabase, invitationId);
  return { invitation };
}
