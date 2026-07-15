import { createPageMetadata } from "@/app/metadata";
import { InviteMembersPageContent } from "@/features/groups/components/invite-members-page-content";

interface InviteMembersPageProps {
  params: Promise<{ groupId: string }>;
}

export const metadata = createPageMetadata(
  "Invite Members",
  "Share an invite link to add members to your group.",
);

export default async function InviteMembersPage({ params }: InviteMembersPageProps) {
  const { groupId } = await params;
  return <InviteMembersPageContent groupId={groupId} />;
}
