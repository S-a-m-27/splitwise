"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DashboardErrorState } from "@/features/dashboard/components/dashboard-error-state";
import { SectionTitle } from "@/features/dashboard/components/section-title";
import { EmptyState } from "@/features/groups/components/empty-state";
import { GroupCard } from "@/features/groups/components/group-card";
import { GroupsFab } from "@/features/groups/components/groups-fab";
import { GroupsListSkeleton } from "@/features/groups/components/groups-skeleton";
import { SearchBar } from "@/features/groups/components/search-bar";
import { useGroups } from "@/features/groups/hooks/use-groups";
import { filterGroups } from "@/features/groups/utils/filter-groups";
import { LIST_STACK_CLASS, PageHeader, PageStack, SECTION_STACK_CLASS } from "@/components/layout/page-layout";

export function GroupsPageContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: groups, isLoading, isError, errorMessage, isSessionError, refetch, isEmpty } =
    useGroups();

  useEffect(() => {
    if (isSessionError) {
      router.replace(ROUTES.login);
    }
  }, [isSessionError, router]);

  const filteredGroups = useMemo(
    () => filterGroups(groups, searchQuery),
    [groups, searchQuery],
  );

  const showNoResults = !isEmpty && filteredGroups.length === 0;

  function handleFilterClick() {
    toast.info("Filters will be available in a future update.");
  }

  if (isError && groups.length === 0) {
    return (
      <DashboardShell>
        <DashboardErrorState
          message={errorMessage ?? "Failed to load groups."}
          onRetry={() => refetch()}
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageStack>
        <PageHeader
          title="Groups"
          description="Split expenses with friends, roommates, and travel buddies."
        />

        {!isEmpty && !isLoading && (
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onFilterClick={handleFilterClick}
          />
        )}

        <section aria-labelledby="groups-list-heading" className={SECTION_STACK_CLASS}>
          <SectionTitle
            id="groups-list-heading"
            title="Your groups"
            subtitle={
              isLoading || isEmpty
                ? undefined
                : `${filteredGroups.length} of ${groups.length} groups`
            }
            className="mb-0"
          />

          {isLoading ? (
            <GroupsListSkeleton />
          ) : isEmpty ? (
            <EmptyState
              title="No groups yet"
              description="Create your first group to start tracking shared expenses with friends."
              actionLabel="Create group"
              actionHref={ROUTES.groupNew}
              icon={<Users className="size-6 text-primary" aria-hidden="true" />}
            />
          ) : showNoResults ? (
            <EmptyState
              title="No matching groups"
              description="Try a different search term or create a new group."
              actionLabel="Create group"
              actionHref={ROUTES.groupNew}
            />
          ) : (
            <ul className={LIST_STACK_CLASS}>
              {filteredGroups.map((group) => (
                <li key={group.id}>
                  <GroupCard group={group} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageStack>

      {!isEmpty && !isLoading && <GroupsFab />}
    </DashboardShell>
  );
}
