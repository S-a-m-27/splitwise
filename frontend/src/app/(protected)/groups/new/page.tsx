import { createPageMetadata } from "@/app/metadata";
import { CreateGroupPageContent } from "@/features/groups/components/create-group-page-content";

export const metadata = createPageMetadata(
  "Create Group",
  "Set up a new group to track shared expenses.",
);

export default function NewGroupPage() {
  return <CreateGroupPageContent />;
}
