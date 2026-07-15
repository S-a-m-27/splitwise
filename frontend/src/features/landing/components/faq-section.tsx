import { AnimateOnScroll } from "@/features/landing/components/animate-on-scroll";
import { FAQAccordion } from "@/features/landing/components/faq-accordion";
import { SectionShell } from "@/features/landing/components/section-shell";
import { STAGGER_MS } from "@/features/landing/constants/animation";
import { LANDING_FAQ } from "@/features/landing/constants/content";
import { LANDING_SECTIONS } from "@/features/landing/constants/sections";

export function FAQSection() {
  const { id, eyebrow, title, description, variant } = LANDING_SECTIONS.faq;

  return (
    <SectionShell
      id={id}
      eyebrow={eyebrow}
      title={title}
      description={description}
      variant={variant}
    >
      <AnimateOnScroll delay={STAGGER_MS.faq}>
        <div className="mx-auto max-w-2xl">
          <FAQAccordion items={LANDING_FAQ} />
        </div>
      </AnimateOnScroll>
    </SectionShell>
  );
}
