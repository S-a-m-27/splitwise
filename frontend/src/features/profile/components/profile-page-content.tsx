"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import { PageHeader, PageStack, SECTION_STACK_CLASS } from "@/components/layout/page-layout";
import { profileEditRoute } from "@/constants/routes";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { formatCurrency } from "@/features/dashboard/utils/format-currency";
import { AboutCard } from "@/features/profile/components/about-card";
import { LogoutDialog } from "@/features/profile/components/logout-dialog";
import { ProfileHeader } from "@/features/profile/components/profile-header";
import {
  ProfileHeaderSkeleton,
  ProfileStatsSkeleton,
} from "@/features/profile/components/profile-skeleton";
import { SectionHeader } from "@/features/profile/components/section-header";
import { SettingsList } from "@/features/profile/components/settings-item";
import { ThemeSelector } from "@/features/profile/components/theme-selector";
import { StatsCard } from "@/features/profile/components/stats-card";
import { APP_ABOUT } from "@/features/profile/constants/app-about";
import { PROFILE_SETTINGS_ITEMS } from "@/features/profile/constants/settings-items";
import { useProfile, useProfileStats } from "@/features/profile/hooks/use-profile";
import type { SettingsItemConfig } from "@/features/profile/types";

export function ProfilePageContent() {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const profileQuery = useProfile();
  const statsQuery = useProfileStats();

  function handleSettingsAction(item: SettingsItemConfig) {
    if (item.id === "logout") {
      setLogoutOpen(true);
      return;
    }

    if (item.id === "preferences") {
      toast.info("More preferences like notifications and currency are coming soon.");
      return;
    }

    if (item.id === "privacy") {
      toast.info("Privacy settings will be available in a future update.");
    }
  }

  const isLoading = profileQuery.isLoading || statsQuery.isLoading;
  const isError = profileQuery.isError || statsQuery.isError;
  const errorMessage = profileQuery.errorMessage ?? statsQuery.errorMessage;

  function handleRetry() {
    void profileQuery.refetch();
    void statsQuery.refetch();
  }

  return (
    <DashboardShell>
      <PageStack>
        <PageHeader
          title="Profile"
          description="Manage your account, preferences, and activity overview."
        />

        {isLoading ? (
          <ProfileHeaderSkeleton />
        ) : isError || !profileQuery.data ? (
          <DashboardErrorState message={errorMessage ?? "Could not load profile."} onRetry={handleRetry} />
        ) : (
          <ProfileHeader profile={profileQuery.data} editHref={profileEditRoute()} />
        )}

        <section aria-labelledby="profile-stats-heading" className={SECTION_STACK_CLASS}>
          <SectionHeader
            id="profile-stats-heading"
            title="Account statistics"
            description="Live totals from your groups, expenses, and balances."
          />

          {statsQuery.isLoading ? (
            <ProfileStatsSkeleton />
          ) : statsQuery.isError || !statsQuery.data ? (
            <DashboardErrorState
              message={statsQuery.errorMessage ?? "Could not load statistics."}
              onRetry={() => void statsQuery.refetch()}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 min-[375px]:gap-4 xl:grid-cols-3">
              <StatsCard
                label="Total groups"
                shortLabel="Groups"
                value={String(statsQuery.data.totalGroups)}
                icon={Users}
                tone="default"
              />
              <StatsCard
                label="Total expenses"
                shortLabel="Expenses"
                value={String(statsQuery.data.totalExpenses)}
                icon={Receipt}
                tone="neutral"
              />
              <StatsCard
                label="Total paid"
                shortLabel="Paid"
                value={formatCurrency(statsQuery.data.totalPaid)}
                icon={Wallet}
                tone="default"
                className="col-span-2 xl:col-span-1"
              />
              <StatsCard
                label="Total owed"
                shortLabel="Owed"
                value={formatCurrency(statsQuery.data.totalOwed)}
                icon={ArrowUpRight}
                tone="negative"
              />
              <StatsCard
                label="Owed to you"
                shortLabel="Owed to you"
                value={formatCurrency(statsQuery.data.totalOwedToYou)}
                icon={ArrowDownLeft}
                tone="positive"
              />
            </div>
          )}
        </section>

        <section aria-labelledby="profile-settings-heading" className={SECTION_STACK_CLASS}>
          <SectionHeader
            id="profile-settings-heading"
            title="Settings"
            description="Account, security, and app information."
          />
          <ThemeSelector />
          <SettingsList items={PROFILE_SETTINGS_ITEMS} onAction={handleSettingsAction} />
        </section>

        <section aria-labelledby="profile-about-preview-heading" className={SECTION_STACK_CLASS}>
          <SectionHeader id="profile-about-preview-heading" title="About this app" />
          <AboutCard about={APP_ABOUT} />
        </section>
      </PageStack>

      <LogoutDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </DashboardShell>
  );
}
