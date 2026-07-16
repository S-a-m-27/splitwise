import { ROUTES, invitationDetailRoute } from "@/constants/routes";
import { invitationService } from "@/features/invitations/services/invitation.service";
import { isInvitationActionable } from "@/features/invitations/domain/invitation-actionability";
import { getSafeRedirect } from "@/lib/safe-redirect";

const INVITATION_PATH_RE =
  /^\/invitations\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;

function parseInvitationId(path: string): string | null {
  const normalized = path.split("?")[0] ?? path;
  const match = normalized.match(INVITATION_PATH_RE);
  return match?.[1] ?? null;
}

/**
 * After sign-in, only follow invitation redirects while the invite is still actionable.
 * Completed or expired invites fall through to the dashboard.
 */
export async function resolvePostLoginRedirect(
  redirectTo: string | null | undefined,
): Promise<string> {
  const safe = getSafeRedirect(redirectTo);
  if (!safe) return ROUTES.dashboard;

  const invitationId = parseInvitationId(safe);
  if (!invitationId) return safe;

  try {
    const invitation = await invitationService.findInvitation(invitationId);
    if (!invitation) return ROUTES.dashboard;

    if (
      invitation.status === "pending" &&
      isInvitationActionable(invitation.status, invitation.expiresAt)
    ) {
      return invitationDetailRoute(invitationId);
    }

    return ROUTES.dashboard;
  } catch {
    return safe;
  }
}
