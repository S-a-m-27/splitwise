export const GROUP_ICON_OPTIONS = [
  "✈️",
  "🏠",
  "💑",
  "🍕",
  "🎉",
  "🏖️",
  "🚗",
  "🛒",
  "☕",
  "🎮",
  "💼",
  "🌴",
] as const;

export type GroupIcon = (typeof GROUP_ICON_OPTIONS)[number];

export const DEFAULT_GROUP_ICON: GroupIcon = "🎉";
