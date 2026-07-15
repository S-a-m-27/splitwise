import { createPageMetadata } from "@/app/metadata";
import { GroupsPage } from "@/features/groups/components/groups-page";

export const metadata = createPageMetadata(
  "Groups",
  "Create and manage expense groups with friends and roommates.",
);

export default function Page() {
  return <GroupsPage />;
}
