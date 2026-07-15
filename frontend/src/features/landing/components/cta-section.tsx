import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/features/landing/components/container";
import { AnimateOnScroll } from "@/features/landing/components/animate-on-scroll";
import { GlowCardWrapper } from "@/features/landing/components/glow-card-wrapper";
import { LANDING_STYLES } from "@/features/landing/constants/styles";
import { cn } from "@/lib/utils";

interface CTASectionProps {
  headline: string;
  subheadline: string;
  buttonLabel: string;
  buttonHref: string;
  className?: string;
}

export function CTASection({
  headline,
  subheadline,
  buttonLabel,
  buttonHref,
  className,
}: CTASectionProps) {
  return (
    <section className={cn(LANDING_STYLES.section, className)}>
      <Container>
        <AnimateOnScroll>
          <GlowCardWrapper>
            <div className="gradient-cta card-glow relative overflow-hidden rounded-3xl border px-6 py-12 text-center shadow-sm transition-shadow duration-300 hover:border-primary/20 sm:px-12 sm:py-16">
            <div
              className="gradient-glow pointer-events-none absolute inset-0 opacity-60"
              aria-hidden="true"
            />
            <div className="relative space-y-4">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl lg:text-4xl">
                {headline}
              </h2>
              <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground text-pretty sm:text-base">
                {subheadline}
              </p>
              <Button
                size="lg"
                className="btn-premium shimmer-sweep group relative mt-2 h-12 min-w-[200px] overflow-hidden border-0 font-semibold"
                render={<Link href={buttonHref} />}
              >
                {buttonLabel}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
              </Button>
            </div>
            </div>
          </GlowCardWrapper>
        </AnimateOnScroll>
      </Container>
    </section>
  );
}
