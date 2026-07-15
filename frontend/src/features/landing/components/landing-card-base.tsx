import { LANDING_STYLES } from "@/features/landing/constants/styles";
import { cn } from "@/lib/utils";

interface LandingCardBaseProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Shared interactive card shell used by feature, step, and benefit cards.
 * Keeps hover, border, and gradient styles consistent across sections.
 */
export function LandingCardBase({ children, className }: LandingCardBaseProps) {
  return (
    <article
      className={cn(
        LANDING_STYLES.cardBase,
        LANDING_STYLES.cardInteractive,
        className,
      )}
    >
      {children}
    </article>
  );
}
