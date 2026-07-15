"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ROUTES } from "@/constants/routes";
import { DASHBOARD_QUICK_ACTIONS } from "@/features/dashboard/constants/quick-actions";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { ActivityCard } from "@/features/dashboard/components/activity-card";
import { BalanceSummaryHero } from "@/features/dashboard/components/balance-summary-hero";
import {
  DashboardSectionEmpty,
  DashboardSectionPanel,
} from "@/features/dashboard/components/dashboard-section-panel";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";
import {
  ActivityFeedSkeleton,
  BalanceSummarySkeleton,
  DashboardHeaderSkeleton,
  GroupsPreviewSkeleton,
  QuickActionsSkeleton,
} from "@/features/dashboard/components/dashboard-skeleton";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { FloatingActionButton } from "@/features/dashboard/components/floating-action-button";
import { GroupPreviewCard } from "@/features/dashboard/components/group-preview-card";
import { QuickActionCard } from "@/features/dashboard/components/quick-action-card";
import { SectionTitle } from "@/features/dashboard/components/section-title";
import { PageStack, SECTION_STACK_CLASS } from "@/components/layout/page-layout";

/**
 * Client dashboard view — loads authenticated data via TanStack Query.
 */
export function DashboardPageContent() {
  const router = useRouter();
  const { data, isLoading, isError, errorMessage, isSessionError, refetch } =
    useDashboard();

  useEffect(() => {
    if (isSessionError) {
      router.replace(ROUTES.login);
    }
  }, [isSessionError, router]);

  if (isError && !data) {
    return (
      <DashboardShell>
        <DashboardErrorState
          message={errorMessage ?? "Failed to load dashboard."}
          onRetry={() => refetch()}
        />
      </DashboardShell>
    );
  }

  const groups = data?.groups ?? [];
  const activities = data?.activities ?? [];
  const groupsEmpty = !isLoading && groups.length === 0;
  const activityEmpty = !isLoading && activities.length === 0;

  return (
    <DashboardShell>
      <PageStack>
        {isLoading || !data ? (
          <DashboardHeaderSkeleton />
        ) : (
          <DashboardHeader user={data.user} />
        )}

        {isLoading || !data ? (
          <BalanceSummarySkeleton />
        ) : (
          <BalanceSummaryHero balances={data.balanceSummary} />
        )}

        <section aria-labelledby="quick-actions-heading" className={SECTION_STACK_CLASS}>
          <SectionTitle id="quick-actions-heading" title="Quick actions" className="mb-0" />
          {isLoading ? (
            <QuickActionsSkeleton />
          ) : (
            <div className="grid grid-cols-3 gap-2.5 min-[375px]:gap-3">
              {DASHBOARD_QUICK_ACTIONS.map((action) => (
                <QuickActionCard key={action.id} action={action} href={action.href} />
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-6 xl:grid xl:grid-cols-2 xl:items-stretch xl:gap-7">
          <section aria-labelledby="groups-heading" className={SECTION_STACK_CLASS}>
            <SectionTitle
              id="groups-heading"
              title="My Groups"
              actionLabel="View all"
              actionHref={ROUTES.groups}
              className="mb-0"
            />
            {isLoading ? (
              <DashboardSectionPanel fill className="p-3 min-[375px]:p-4">
                <GroupsPreviewSkeleton />
              </DashboardSectionPanel>
            ) : isError ? (
              <DashboardSectionPanel fill className="p-4">
                <DashboardErrorState
                  message={errorMessage ?? "Failed to load groups."}
                  onRetry={() => refetch()}
                />
              </DashboardSectionPanel>
            ) : (
              <DashboardSectionPanel fill>
                {groupsEmpty ? (
                  <DashboardSectionEmpty
                    title="No groups yet"
                    description="Create a group to start splitting expenses with friends."
                  />
                ) : (
                  <div>
                    {groups.map((group, index) => (
                      <GroupPreviewCard
                        key={group.id}
                        group={group}
                        isLast={index === groups.length - 1}
                      />
                    ))}
                  </div>
                )}
              </DashboardSectionPanel>
            )}
          </section>

          <section aria-labelledby="activity-heading" className={SECTION_STACK_CLASS}>
            <SectionTitle
              id="activity-heading"
              title="Recent Activity"
              actionLabel="View all"
              actionHref={ROUTES.activity}
              className="mb-0"
            />
            <DashboardSectionPanel fill>
              {isLoading ? (
                <div className="p-3 min-[375px]:p-4">
                  <ActivityFeedSkeleton />
                </div>
              ) : isError ? (
                <div className="p-4">
                  <DashboardErrorState
                    message={errorMessage ?? "Failed to load activity."}
                    onRetry={() => refetch()}
                  />
                </div>
              ) : activityEmpty ? (
                <DashboardSectionEmpty
                  title="No activity yet"
                  description="Expenses and settlements will appear here once you add them."
                />
              ) : (
                <div>
                  {activities.map((item, index) => (
                    <ActivityCard
                      key={item.id}
                      activity={item}
                      isLast={index === activities.length - 1}
                    />
                  ))}
                </div>
              )}
            </DashboardSectionPanel>
          </section>
        </div>
      </PageStack>

      <FloatingActionButton />
    </DashboardShell>
  );
}
