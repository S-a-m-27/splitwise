"use client";

import { toast } from "sonner";
import { ROUTES } from "@/constants/routes";
import { PageStack, SECTION_STACK_CLASS } from "@/components/layout/page-layout";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { AboutCard } from "@/features/profile/components/about-card";
import { AboutLinkItem } from "@/features/profile/components/settings-item";
import { ProfileBackHeader } from "@/features/profile/components/profile-back-header";
import { SectionHeader } from "@/features/profile/components/section-header";
import { APP_ABOUT } from "@/features/profile/constants/app-about";

export function AboutPageContent() {
  return (
    <DashboardShell>
      <PageStack>
        <ProfileBackHeader title="About" backHref={ROUTES.profile} />

        <AboutCard about={APP_ABOUT} />

        <section aria-labelledby="legal-links-heading" className={SECTION_STACK_CLASS}>
          <SectionHeader
            id="legal-links-heading"
            title="Legal"
            description="Policy pages are placeholders in this UI milestone."
          />

          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
            <AboutLinkItem
              label="Privacy Policy"
              description="How we handle your data"
              onPlaceholderClick={() =>
                toast.info("Privacy policy page will be available soon.")
              }
            />
            <AboutLinkItem
              label="Terms of Service"
              description="Rules for using the app"
              isLast
              onPlaceholderClick={() =>
                toast.info("Terms of service page will be available soon.")
              }
            />
          </div>
        </section>
      </PageStack>
    </DashboardShell>
  );
}
