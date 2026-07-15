import type { GroupType } from "@/features/groups/types";

export interface GroupTypeOption {
  value: GroupType;
  label: string;
  description: string;
}

export const GROUP_TYPE_OPTIONS: GroupTypeOption[] = [
  {
    value: "trip",
    label: "Trip",
    description: "Vacations, road trips, and travel expenses",
  },
  {
    value: "home",
    label: "Home",
    description: "Rent, utilities, and household bills",
  },
  {
    value: "couple",
    label: "Couple",
    description: "Shared expenses between partners",
  },
  {
    value: "friends",
    label: "Friends",
    description: "Dinners, outings, and casual hangouts",
  },
  {
    value: "other",
    label: "Other",
    description: "Any other shared expense group",
  },
];
