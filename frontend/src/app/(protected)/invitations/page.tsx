import { createPageMetadata } from "@/app/metadata";
import { MyInvitationsPageContent } from "@/features/invitations/components/my-invitations-page-content";

export const metadata = createPageMetadata(
  "My Invitations",
  "View and respond to your group invitations.",
);

export default function InvitationsPage() {
  return <MyInvitationsPageContent />;
}
