"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Clock3 } from "lucide-react";
import { InviteSearchInput } from "@/features/invitations/components/invite-search-input";
import { InviteSearchResultList } from "@/features/invitations/components/invite-search-result";
import { InvitationEmptyState } from "@/features/invitations/components/invitation-empty-state";
import { InvitationErrorState } from "@/features/invitations/components/invitation-error-state";
import { InvitationSkeleton } from "@/features/invitations/components/invitation-skeleton";
import { invitationToast } from "@/features/invitations/components/invitation-toast";
import { UnregisteredUserCard } from "@/features/invitations/components/unregistered-user-card";
import { useInvitationSearch, useCreateInvitation } from "@/features/invitations/hooks/use-invitations";
import { getInvitationErrorMessage } from "@/features/invitations/services/invitation.service";
import type { InviteSearchResult } from "@/features/invitations/types/ui";
import { META_LABEL_CLASS, META_TEXT_CLASS } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface InviteModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly groupId: string;
  readonly groupName: string;
  readonly groupIcon?: string;
}

export function InviteModal({
  open,
  onOpenChange,
  groupId,
  groupName,
  groupIcon = "👥",
}: InviteModalProps) {
  const search = useInvitationSearch(groupId);
  const createInvitation = useCreateInvitation(groupId);
  const [recentExpanded, setRecentExpanded] = useState(true);

  function handleInviteRegistered(result: InviteSearchResult) {
    createInvitation.mutate(
      {
        groupId,
        invitedEmail: result.email,
        isRegistered: true,
      },
      {
        onSuccess: () => {
          invitationToast.sent(result.displayName);
          onOpenChange(false);
          search.clearSearch();
        },
        onError: (error) => invitationToast.error(getInvitationErrorMessage(error)),
      },
    );
  }

  function handleInviteUnregistered() {
    const email = search.query.trim().toLowerCase();
    createInvitation.mutate(
      {
        groupId,
        invitedEmail: email,
        isRegistered: false,
      },
      {
        onSuccess: () => {
          invitationToast.sent();
          onOpenChange(false);
          search.clearSearch();
        },
        onError: (error) => invitationToast.error(getInvitationErrorMessage(error)),
      },
    );
  }

  function handleRecentClick(term: string) {
    search.setQuery(term);
  }

  const showRecent = !search.query && search.recentSearches.length > 0;
  const showResults = search.query.trim().length > 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/40 transition-opacity duration-200",
            "data-ending-style:opacity-0 data-starting-style:opacity-0",
            "supports-backdrop-filter:backdrop-blur-xs",
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed right-0 bottom-0 left-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden",
            "rounded-t-3xl border border-border bg-card shadow-2xl",
            "transition-all duration-200",
            "data-ending-style:translate-y-8 data-ending-style:opacity-0",
            "data-starting-style:translate-y-8 data-starting-style:opacity-0",
            "min-[768px]:top-1/2 min-[768px]:right-auto min-[768px]:bottom-auto min-[768px]:left-1/2",
            "min-[768px]:max-h-[85vh] min-[768px]:w-full min-[768px]:max-w-lg",
            "min-[768px]:-translate-x-1/2 min-[768px]:-translate-y-1/2 min-[768px]:rounded-2xl",
          )}
        >
          {open && (
            <div className="flex min-h-0 flex-1 flex-col">
              <header className="shrink-0 border-b border-border/60 px-5 pt-5 pb-4">
                <div className="flex items-start gap-3">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-lg"
                    aria-hidden="true"
                  >
                    {groupIcon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Dialog.Title className="font-heading text-xl font-bold text-foreground">
                      Invite Members
                    </Dialog.Title>
                    <Dialog.Description className={cn("mt-1", META_TEXT_CLASS)}>
                      Add people to {groupName} by search or email.
                    </Dialog.Description>
                  </div>
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <InviteSearchInput
                  value={search.query}
                  onChange={search.setQuery}
                  onClear={search.clearSearch}
                />

                {showRecent && (
                  <section className="mt-5" aria-label="Recent searches">
                    <button
                      type="button"
                      onClick={() => setRecentExpanded((value) => !value)}
                      className={cn("flex w-full items-center gap-2", META_LABEL_CLASS)}
                    >
                      <Clock3 className="size-3.5" aria-hidden="true" />
                      Recent searches
                    </button>
                    {recentExpanded && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {search.recentSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => handleRecentClick(term)}
                            className="rounded-full border border-border/80 bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {showResults && search.status === "loading" && (
                  <div className="mt-5">
                    <InvitationSkeleton variant="search" count={3} />
                  </div>
                )}

                {showResults && search.status === "error" && (
                  <div className="mt-5">
                    <InvitationErrorState variant="network" message={search.errorMessage ?? undefined} />
                  </div>
                )}

                {showResults &&
                  search.status === "success" &&
                  search.results.length > 0 && (
                    <div className="mt-5">
                      <p className={cn("mb-3", META_LABEL_CLASS)}>Search results</p>
                      <InviteSearchResultList
                        results={search.results}
                        onInvite={handleInviteRegistered}
                        inviteDisabled={createInvitation.isPending}
                      />
                    </div>
                  )}

                {search.showUnregisteredCard && (
                  <div className="mt-5">
                    <UnregisteredUserCard
                      email={search.query.trim().toLowerCase()}
                      onInvite={handleInviteUnregistered}
                      disabled={createInvitation.isPending}
                    />
                  </div>
                )}

                {showResults &&
                  search.status === "success" &&
                  search.results.length === 0 &&
                  !search.showUnregisteredCard && (
                    <div className="mt-5">
                      <InvitationEmptyState variant="no_search_results" />
                    </div>
                  )}

                {!showResults && (
                  <div className="mt-8 rounded-2xl border border-dashed border-border/80 bg-muted/15 px-5 py-8 text-center">
                    <p className="text-sm font-semibold text-foreground">Find someone to invite</p>
                    <p className={cn("mt-2 leading-relaxed", META_TEXT_CLASS)}>
                      Start typing a name or email above. Registered users appear in results;
                      unknown emails can be invited directly.
                    </p>
                  </div>
                )}
              </div>

              <footer className="shrink-0 border-t border-border/60 px-5 py-4">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="h-11 w-full rounded-xl border border-border/80 bg-muted/30 text-sm font-semibold text-foreground transition-colors hover:bg-muted/50"
                >
                  Close
                </button>
              </footer>
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
