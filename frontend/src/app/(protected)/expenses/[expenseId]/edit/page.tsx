import { createPageMetadata } from "@/app/metadata";
import { EditExpensePageContent } from "@/features/expenses/components/edit-expense-page-content";

interface PageProps {
  params: Promise<{ expenseId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { expenseId } = await params;
  return createPageMetadata("Edit expense", `Edit expense ${expenseId}.`);
}

export default async function Page({ params }: PageProps) {
  const { expenseId } = await params;
  return <EditExpensePageContent expenseId={expenseId} />;
}
