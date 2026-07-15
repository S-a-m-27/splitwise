import { Container } from "@/features/landing/components/container";
import { AnimateOnScroll } from "@/features/landing/components/animate-on-scroll";
import { SectionTitle } from "@/features/landing/components/section-title";
import { LANDING_STYLES } from "@/features/landing/constants/styles";
import { cn } from "@/lib/utils";

type SectionVariant = "default" | "alt" | "faq";

const SECTION_VARIANT_CLASSES: Record<SectionVariant, string> = {
  default: LANDING_STYLES.section,
  alt: LANDING_STYLES.sectionAlt,
  faq: LANDING_STYLES.sectionFaq,
};

interface SectionShellProps {
  /** Anchor ID for in-page navigation (e.g. navbar hash links). */
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  variant?: SectionVariant;
  className?: string;
  children: React.ReactNode;
}

/**
 * Standard landing section layout: semantic wrapper, max-width container,
 * scroll-animated title block, and a slot for section-specific content.
 */
export function SectionShell({
  id,
  eyebrow,
  title,
  description,
  variant = "default",
  className,
  children,
}: SectionShellProps) {
  return (
    <section id={id} className={cn(SECTION_VARIANT_CLASSES[variant], className)}>
      <Container>
        <AnimateOnScroll>
          <SectionTitle
            eyebrow={eyebrow}
            title={title}
            description={description}
            className={LANDING_STYLES.titleSpacing}
          />
        </AnimateOnScroll>
        {children}
      </Container>
    </section>
  );
}
