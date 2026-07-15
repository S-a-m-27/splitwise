import { FeatureCard } from "@/features/landing/components/feature-card";
import { LandingGrid } from "@/features/landing/components/landing-grid";
import { SectionShell } from "@/features/landing/components/section-shell";
import { StaggeredGridItem } from "@/features/landing/components/staggered-grid-item";
import { STAGGER_MS } from "@/features/landing/constants/animation";
import { LANDING_FEATURES } from "@/features/landing/constants/content";
import { LANDING_SECTIONS } from "@/features/landing/constants/sections";

export function FeaturesSection() {
  const { id, eyebrow, title, description } = LANDING_SECTIONS.features;

  return (
    <SectionShell id={id} eyebrow={eyebrow} title={title} description={description}>
      <LandingGrid columns={3}>
        {LANDING_FEATURES.map((feature, index) => (
          <StaggeredGridItem
            key={feature.title}
            index={index}
            staggerMs={STAGGER_MS.feature}
          >
            <FeatureCard
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              tag={feature.tag}
              highlight={feature.highlight}
            />
          </StaggeredGridItem>
        ))}
      </LandingGrid>
    </SectionShell>
  );
}
