import { DashboardPage } from "@/features/dashboard/components/dashboard-page";
import { createPageMetadata } from "@/app/metadata";

export const metadata = createPageMetadata(
  "Dashboard",
  "View your balances, groups, and recent expense activity.",
);

export default function Page() {
  return <DashboardPage />;
}
