import { createPageMetadata } from "@/app/metadata";
import { ExpensesPage } from "@/features/expenses/components/expenses-page";

export const metadata = createPageMetadata(
  "Expenses",
  "View and manage shared expenses across your groups.",
);

export default function Page() {
  return <ExpensesPage />;
}
