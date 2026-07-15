import { ROUTES } from "@/constants/routes";
import type { QuickAction } from "@/features/dashboard/types";

export interface QuickActionConfig extends QuickAction {
  href: string;
}

export const DASHBOARD_QUICK_ACTIONS: QuickActionConfig[] = [
  {
    id: "create-group",
    label: "Create Group",
    shortLabel: "Group",
    icon: "group",
    href: ROUTES.groups,
  },
  {
    id: "add-expense",
    label: "Add Expense",
    shortLabel: "Add",
    icon: "expense",
    href: ROUTES.expenseNew,
  },
  {
    id: "settle-up",
    label: "Settle Up",
    shortLabel: "Settle",
    icon: "settle",
    href: ROUTES.settlements,
  },
];
