import { createPageMetadata } from "@/app/metadata";
import { InviteJoinPageContent } from "@/features/groups/components/invite-join-page-content";

interface InviteJoinPageProps {
  params: Promise<{ inviteCode: string }>;
}

export const metadata = createPageMetadata(
  "Join Group",
  "Accept a group invitation and start splitting expenses.",
);

export default async function InviteJoinPage({ params }: InviteJoinPageProps) {
  const { inviteCode } = await params;
  return <InviteJoinPageContent inviteCode={inviteCode} />;
}
