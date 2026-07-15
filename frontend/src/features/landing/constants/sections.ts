import type { LandingSectionConfig } from "@/features/landing/types";

/**
 * Section copy and anchor IDs.
 * Content-only — no UI logic. Safe for future i18n extraction.
 */
export const LANDING_SECTIONS = {
  features: {
    id: "features",
    eyebrow: "Features",
    title: "Everything you need to split fairly",
    description:
      "From weekend trips to monthly rent, Splitwise handles the math so you can focus on what matters.",
  },
  howItWorks: {
    id: "how-it-works",
    eyebrow: "How it works",
    title: "Four steps to fair splits",
    description:
      "No spreadsheets. No confusion. Just add expenses and let Splitwise handle the rest.",
    variant: "alt",
  },
  whyChooseUs: {
    eyebrow: "Why Splitwise",
    title: "Built for how you actually split bills",
    description:
      "Other apps feel clunky on mobile or drown you in features. Splitwise is focused, fast, and designed for real life.",
  },
  faq: {
    id: "faq",
    eyebrow: "FAQ",
    title: "Common questions",
    description:
      "Everything you need to know before creating your first group.",
    variant: "faq",
  },
} as const satisfies Record<string, LandingSectionConfig>;
