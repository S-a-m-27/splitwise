import type {
  LandingBenefit,
  LandingFaqItem,
  LandingFeature,
  LandingStep,
} from "@/features/landing/types";
import {
  Calculator,
  CreditCard,
  Layers,
  Shield,
  Smartphone,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

/**
 * Marketing copy and navigation data for the landing page.
 * Types live in types/; section metadata in constants/sections.ts.
 */

export const LANDING_NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
] as const;

export const LANDING_FOOTER_LINKS = {
  product: [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
  ],
  legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
  ],
  social: [
    { label: "Twitter", href: "https://twitter.com" },
    { label: "GitHub", href: "https://github.com" },
    { label: "LinkedIn", href: "https://linkedin.com" },
  ],
} as const;

/** Feature cards displayed in the Features section grid. */
export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: CreditCard,
    title: "Shared Expense Tracking",
    description:
      "Log every shared purchase in seconds. Split equally, by exact amounts, or percentages — however your group prefers.",
    tag: "Core",
    highlight: "3 split modes",
  },
  {
    icon: Users,
    title: "Group Management",
    description:
      "Create groups for roommates, trips, couples, or teams. Invite members and keep every shared cost in one place.",
    tag: "Groups",
    highlight: "Unlimited members",
  },
  {
    icon: Calculator,
    title: "Real-time Balances",
    description:
      "See who owes whom at a glance. Balances update instantly as expenses are added, edited, or removed.",
    tag: "Live",
    highlight: "Instant updates",
  },
  {
    icon: Zap,
    title: "Fast Settlements",
    description:
      "Record payments and settle up in a tap. No more awkward spreadsheets or forgotten IOUs.",
    tag: "1-tap",
    highlight: "Under 5 seconds",
  },
  {
    icon: Wifi,
    title: "Offline Support",
    description:
      "Add expenses even without a connection. Your data syncs automatically when you're back online.",
    tag: "PWA",
    highlight: "Auto-sync",
  },
  {
    icon: Shield,
    title: "Secure Authentication",
    description:
      "Enterprise-grade security with encrypted data and row-level access controls. Your finances stay private.",
    tag: "Encrypted",
    highlight: "RLS protected",
  },
];

/** Timeline steps for the How It Works section. */
export const LANDING_STEPS: LandingStep[] = [
  {
    step: 1,
    title: "Create a Group",
    description:
      "Start a group for your apartment, vacation, or event. Invite friends in seconds.",
    duration: "~30 sec",
    icon: Users,
  },
  {
    step: 2,
    title: "Add Expenses",
    description:
      "Record who paid and how to split. Attach notes so everyone knows what each charge is for.",
    duration: "~10 sec",
    icon: CreditCard,
  },
  {
    step: 3,
    title: "Smart Balances",
    description:
      "Numbers crunch instantly. Everyone sees a clear, fair breakdown of who owes what.",
    duration: "Instant",
    icon: Calculator,
  },
  {
    step: 4,
    title: "Settle Up",
    description:
      "Mark debts as paid when you settle. Keep friendships intact and accounts balanced.",
    duration: "1 tap",
    icon: Zap,
  },
];

/** Benefit cards for the Why Choose Us section. */
export const LANDING_BENEFITS: LandingBenefit[] = [
  {
    icon: Layers,
    title: "Simple",
    description:
      "No learning curve. Add an expense in three taps and move on with your day.",
    metric: "3 taps",
  },
  {
    icon: Zap,
    title: "Fast",
    description:
      "Built for speed. Optimized for mobile so you can split bills before the waiter returns.",
    metric: "< 5 sec",
  },
  {
    icon: Shield,
    title: "Secure",
    description:
      "Your data is encrypted in transit and at rest. Only your group members see shared expenses.",
    metric: "256-bit",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    description:
      "Designed for your phone first. Install as a PWA for a native app experience.",
    metric: "PWA ready",
  },
  {
    icon: Wifi,
    title: "Offline Ready",
    description:
      "Works without signal. Queue expenses on the go and sync when connectivity returns.",
    metric: "Auto-sync",
  },
];

/** FAQ accordion items. */
export const LANDING_FAQ: LandingFaqItem[] = [
  {
    question: "Is Splitwise free to use?",
    answer:
      "Yes. Core features — groups, expense tracking, and balance calculations — are free. Premium features for larger teams may be introduced later.",
  },
  {
    question: "How do expense splits work?",
    answer:
      "You can split equally among all members, assign exact amounts to each person, or divide by percentage. Splitwise handles the math so everyone sees an accurate balance.",
  },
  {
    question: "Do I need an account to get started?",
    answer:
      "Yes, a free account lets you create groups, invite others, and keep your balances synced across devices. Sign up takes less than a minute.",
  },
  {
    question: "Is my financial data secure?",
    answer:
      "Absolutely. We use industry-standard encryption, secure authentication, and database-level access controls so only authorized group members can view shared expenses.",
  },
  {
    question: "Does Splitwise work offline?",
    answer:
      "Yes. You can add expenses without an internet connection. They sync automatically when you're back online — perfect for travel or spotty coverage.",
  },
  {
    question: "Who is Splitwise built for?",
    answer:
      "Anyone who shares costs — roommates splitting rent, friends on a trip, couples managing household expenses, families tracking shared purchases, or teams handling project costs.",
  },
];

/** Hero headline, subheadline, and CTA labels. */
export const LANDING_HERO = {
  badge: "Trusted by groups worldwide",
  headline: "Split expenses effortlessly with friends and family.",
  subheadline:
    "Track shared spending, calculate balances automatically, and settle up in seconds. Built for roommates, travelers, couples, and anyone who splits the bill.",
  primaryCta: "Get started free",
  secondaryCta: "See how it works",
} as const;

/** Bottom-of-page call-to-action copy. */
export const LANDING_CTA = {
  headline: "Ready to split smarter?",
  subheadline:
    "Join thousands of groups who've ditched the spreadsheet. Create your first group in under a minute.",
  buttonLabel: "Create free account",
} as const;
