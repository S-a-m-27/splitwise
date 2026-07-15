import { createPageMetadata } from "@/app/metadata";
import { GroupDetailPageContent } from "@/features/groups/components/group-detail-page-content";

interface GroupDetailPageProps {
  params: Promise<{ groupId: string }>;
}

export const metadata = createPageMetadata("Group", "View group details and members.");

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { groupId } = await params;
  return <GroupDetailPageContent groupId={groupId} />;
}
