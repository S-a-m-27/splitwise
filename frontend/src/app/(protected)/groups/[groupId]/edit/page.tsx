import { createPageMetadata } from "@/app/metadata";
import { EditGroupPageContent } from "@/features/groups/components/edit-group-page-content";

interface EditGroupPageProps {
  params: Promise<{ groupId: string }>;
}

export const metadata = createPageMetadata(
  "Edit Group",
  "Update group name, icon, and description.",
);

export default async function EditGroupPage({ params }: EditGroupPageProps) {
  const { groupId } = await params;
  return <EditGroupPageContent groupId={groupId} />;
}
