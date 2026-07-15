import { Container } from "@/features/landing/components/container";
import { FooterLinkGroup } from "@/features/landing/components/footer-link-group";
import { Logo } from "@/features/landing/components/logo";
import { LANDING_FOOTER_LINKS } from "@/features/landing/constants/content";
import { APP_CONFIG } from "@/constants/config";
import { Separator } from "@/components/ui/separator";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t gradient-section">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Split expenses, track balances, and settle up — without the
              awkwardness.
            </p>
          </div>

          <FooterLinkGroup title="Product" links={LANDING_FOOTER_LINKS.product} />
          <FooterLinkGroup title="Legal" links={LANDING_FOOTER_LINKS.legal} />
          <FooterLinkGroup title="Social" links={LANDING_FOOTER_LINKS.social} external />
        </div>

        <Separator className="my-8" />

        <p className="text-center text-xs text-muted-foreground">
          &copy; {year} {APP_CONFIG.name}. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
