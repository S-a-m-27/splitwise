import { createPageMetadata } from "@/app/metadata";
import { SettlementsPageContent } from "@/features/settlements/components/settlements-page-content";

export const metadata = createPageMetadata(
  "Settle Up",
  "Record payments and simplify outstanding balances.",
);

export default function SettlementsPage() {
  return <SettlementsPageContent />;
}
