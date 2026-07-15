/**
 * Shared animation timing for scroll-reveal stagger effects.
 * Keep delays small to maintain a snappy, mobile-first feel.
 */
export const STAGGER_MS = {
  feature: 60,
  step: 80,
  benefit: 70,
  faq: 100,
  hero: {
    badge: 0,
    headline: 80,
    subheadline: 160,
    cta: 240,
    mockup: 120,
  },
} as const;
