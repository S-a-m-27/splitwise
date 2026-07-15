import { LandingGrid } from "@/features/landing/components/landing-grid";
import { SectionShell } from "@/features/landing/components/section-shell";
import { StaggeredGridItem } from "@/features/landing/components/staggered-grid-item";
import { StepCard } from "@/features/landing/components/step-card";
import { STAGGER_MS } from "@/features/landing/constants/animation";
import { LANDING_STEPS } from "@/features/landing/constants/content";
import { LANDING_SECTIONS } from "@/features/landing/constants/sections";

export function HowItWorksSection() {
  const { id, eyebrow, title, description, variant } =
    LANDING_SECTIONS.howItWorks;

  return (
    <SectionShell
      id={id}
      eyebrow={eyebrow}
      title={title}
      description={description}
      variant={variant}
    >
      <LandingGrid columns={4}>
        {LANDING_STEPS.map((step, index) => (
          <StaggeredGridItem
            key={step.step}
            index={index}
            staggerMs={STAGGER_MS.step}
          >
            <StepCard
              step={step.step}
              title={step.title}
              description={step.description}
              duration={step.duration}
              icon={step.icon}
              isLast={index === LANDING_STEPS.length - 1}
            />
          </StaggeredGridItem>
        ))}
      </LandingGrid>
    </SectionShell>
  );
}
