import type { LucideIcon } from "lucide-react";
import { Equal, Hash, Percent, Receipt } from "lucide-react";
import type { SplitType } from "@/features/expenses/types";

export interface SplitTypeOption {
  id: SplitType;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}

export const SPLIT_TYPE_OPTIONS: SplitTypeOption[] = [
  {
    id: "equal",
    label: "Split equally",
    shortLabel: "Equally",
    description: "Divide the total evenly among everyone",
    icon: Equal,
  },
  {
    id: "exact",
    label: "Exact amounts",
    shortLabel: "Exact",
    description: "Enter precisely how much each person owes",
    icon: Receipt,
  },
  {
    id: "percentage",
    label: "By percentage",
    shortLabel: "Percent",
    description: "Assign a percentage of the total to each person",
    icon: Percent,
  },
  {
    id: "shares",
    label: "By shares",
    shortLabel: "Shares",
    description: "Split based on share counts (e.g. 2 shares vs 1)",
    icon: Hash,
  },
];

export function getSplitTypeLabel(splitType: SplitType): string {
  return SPLIT_TYPE_OPTIONS.find((option) => option.id === splitType)?.shortLabel ?? "Equally";
}
