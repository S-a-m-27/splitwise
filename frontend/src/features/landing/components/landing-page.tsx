import { CTASection } from "@/features/landing/components/cta-section";
import { FAQSection } from "@/features/landing/components/faq-section";
import { FeaturesSection } from "@/features/landing/components/features-section";
import { Hero } from "@/features/landing/components/hero";
import { HowItWorksSection } from "@/features/landing/components/how-it-works-section";
import { LandingFooter } from "@/features/landing/components/landing-footer";
import { LandingNavbar } from "@/features/landing/components/landing-navbar";
import { WhyChooseUsSection } from "@/features/landing/components/why-choose-us-section";
import { LANDING_CTA } from "@/features/landing/constants/content";
import { ROUTES } from "@/constants/routes";

/**
 * Marketing landing page composition.
 *
 * Structure:
 *   Navbar → Hero → Features → How It Works → Why Choose Us → FAQ → CTA → Footer
 *
 * Copy lives in constants/; layout primitives in components/.
 * Add new sections by creating a *-section.tsx and inserting it here.
 */
export function LandingPage() {
  return (
    <div className="gradient-page">
      <LandingNavbar />
      <main>
        <Hero />
        <FeaturesSection />
        <HowItWorksSection />
        <WhyChooseUsSection />
        <FAQSection />
        <CTASection
          headline={LANDING_CTA.headline}
          subheadline={LANDING_CTA.subheadline}
          buttonLabel={LANDING_CTA.buttonLabel}
          buttonHref={ROUTES.register}
        />
      </main>
      <LandingFooter />
    </div>
  );
}
