import { AnimateOnScroll } from "@/features/landing/components/animate-on-scroll";
import { GlowCardWrapper } from "@/features/landing/components/glow-card-wrapper";
import { cn } from "@/lib/utils";

interface StaggeredGridItemProps {
  /** Zero-based index used to compute scroll-reveal delay. */
  index: number;
  /** Milliseconds added per index (see constants/animation.ts). */
  staggerMs: number;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a grid cell with scroll animation + hover glow.
 * Ensures equal-height cards via the `h-full` chain.
 */
export function StaggeredGridItem({
  index,
  staggerMs,
  children,
  className,
}: StaggeredGridItemProps) {
  return (
    <AnimateOnScroll
      delay={index * staggerMs}
      className={cn("h-full", className)}
    >
      <GlowCardWrapper className="h-full">{children}</GlowCardWrapper>
    </AnimateOnScroll>
  );
}
