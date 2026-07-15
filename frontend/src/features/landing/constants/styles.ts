/**
 * Centralized Tailwind class groups for the landing page.
 * Single source of truth — update spacing and card styles here.
 */
export const LANDING_STYLES = {
  section: "py-16 sm:py-24",
  sectionAlt: "border-y gradient-section py-16 sm:py-24",
  sectionFaq: "border-t gradient-section py-16 sm:py-24",
  titleSpacing: "mb-10 sm:mb-14",
  gridBase: "grid items-stretch gap-4 overflow-visible sm:grid-cols-2 sm:gap-5",
  gridCols3: "lg:grid-cols-3 lg:gap-6",
  gridCols4: "lg:grid-cols-4 lg:gap-6",
  cardInteractive:
    "transition-all duration-300 hover:-translate-y-1 hover:border-primary/25",
  cardBase:
    "group relative flex h-full overflow-hidden gradient-card card-glow rounded-2xl border p-5 shadow-sm",
} as const;
