import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/features/landing/components/container";
import { AnimateOnScroll } from "@/features/landing/components/animate-on-scroll";
import { GlowCardWrapper } from "@/features/landing/components/glow-card-wrapper";
import { HeroMockup } from "@/features/landing/components/hero-mockup";
import { STAGGER_MS } from "@/features/landing/constants/animation";
import { LANDING_HERO } from "@/features/landing/constants/content";
import { ROUTES } from "@/constants/routes";

/**
 * Above-the-fold hero: headline, CTAs, and decorative app mockup.
 * Uses a distinct layout (not SectionShell) due to split-column design.
 */
export function Hero() {
  const { hero: delays } = STAGGER_MS;

  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-16 sm:pb-20 lg:pt-24 lg:pb-28">
      {/* Layered decorative background: drifting aurora + soft glow + grid */}
      <div className="aurora" aria-hidden="true" />
      <div className="gradient-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="animate-grid-pan pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_at_center,black_15%,transparent_65%)] opacity-25"
        aria-hidden="true"
      />

      <Container className="relative">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex w-full flex-col items-center text-center lg:max-w-xl lg:items-start lg:text-left">
            <AnimateOnScroll delay={delays.badge} direction="down">
              <Badge
                variant="secondary"
                className="animate-pulse-glow mb-5 gap-1.5 px-3 py-1 text-xs font-medium"
              >
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                {LANDING_HERO.badge}
              </Badge>
            </AnimateOnScroll>

            <AnimateOnScroll delay={delays.headline}>
              <h1 className="font-heading text-[1.75rem] leading-[1.15] font-extrabold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
                <span className="text-gradient-animated">
                  {LANDING_HERO.headline}
                </span>
              </h1>
            </AnimateOnScroll>

            <AnimateOnScroll delay={delays.subheadline}>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground text-pretty sm:text-base sm:leading-7">
                {LANDING_HERO.subheadline}
              </p>
            </AnimateOnScroll>

            <AnimateOnScroll delay={delays.cta}>
              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button
                  size="lg"
                  className="btn-premium shimmer-sweep group relative h-12 w-full overflow-hidden border-0 font-semibold sm:w-auto"
                  render={<Link href={ROUTES.register} />}
                >
                  {LANDING_HERO.primaryCta}
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full transition-colors duration-300 hover:border-primary/40 hover:bg-accent/50 sm:w-auto"
                  render={<Link href="#how-it-works" />}
                >
                  {LANDING_HERO.secondaryCta}
                </Button>
              </div>
            </AnimateOnScroll>
          </div>

          <AnimateOnScroll
            delay={delays.mockup}
            direction="left"
            className="w-full lg:flex-1"
          >
            <GlowCardWrapper>
              <HeroMockup />
            </GlowCardWrapper>
          </AnimateOnScroll>
        </div>
      </Container>
    </section>
  );
}
