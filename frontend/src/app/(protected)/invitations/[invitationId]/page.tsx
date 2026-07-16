import { createPageMetadata } from "@/app/metadata";
import { InvitationDetailPageContent } from "@/features/invitations/components/invitation-detail-page-content";

export const metadata = createPageMetadata(
  "Invitation Details",
  "View invitation details and respond.",
);

interface InvitationDetailPageProps {
  params: Promise<{ invitationId: string }>;
}

export default async function InvitationDetailPage({ params }: InvitationDetailPageProps) {
  const { invitationId } = await params;
  return <InvitationDetailPageContent invitationId={invitationId} />;
}
