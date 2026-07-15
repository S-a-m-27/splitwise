import { BenefitCard } from "@/features/landing/components/benefit-card";
import { LandingGrid } from "@/features/landing/components/landing-grid";
import { SectionShell } from "@/features/landing/components/section-shell";
import { StaggeredGridItem } from "@/features/landing/components/staggered-grid-item";
import { STAGGER_MS } from "@/features/landing/constants/animation";
import { LANDING_BENEFITS } from "@/features/landing/constants/content";
import { LANDING_SECTIONS } from "@/features/landing/constants/sections";

export function WhyChooseUsSection() {
  const { eyebrow, title, description } = LANDING_SECTIONS.whyChooseUs;

  return (
    <SectionShell eyebrow={eyebrow} title={title} description={description}>
      <LandingGrid columns={3} className="lg:gap-5">
        {LANDING_BENEFITS.map((benefit, index) => (
          <StaggeredGridItem
            key={benefit.title}
            index={index}
            staggerMs={STAGGER_MS.benefit}
          >
            <BenefitCard
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
              metric={benefit.metric}
            />
          </StaggeredGridItem>
        ))}
      </LandingGrid>
    </SectionShell>
  );
}
