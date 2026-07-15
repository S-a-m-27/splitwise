import { createPageMetadata } from "@/app/metadata";
import { ExpenseDetailPageContent } from "@/features/expenses/components/expense-detail-page-content";

interface PageProps {
  params: Promise<{ expenseId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { expenseId } = await params;
  return createPageMetadata("Expense details", `View expense ${expenseId}.`);
}

export default async function Page({ params }: PageProps) {
  const { expenseId } = await params;
  return <ExpenseDetailPageContent expenseId={expenseId} />;
}
