import { createPageMetadata } from "@/app/metadata";
import { ActivityPageContent } from "@/features/activity/components/activity-page-content";

export const metadata = createPageMetadata(
  "Activity",
  "Expenses and settlements across all your groups.",
);

export default function ActivityPage() {
  return <ActivityPageContent />;
}
