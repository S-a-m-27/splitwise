"use client";

import type { InviteSearchResult } from "@/features/invitations/types/ui";
import { RegisteredUserCard } from "@/features/invitations/components/registered-user-card";
import { cn } from "@/lib/utils";

interface InviteSearchResultListProps {
  readonly results: readonly InviteSearchResult[];
  readonly onInvite: (result: InviteSearchResult) => void;
  readonly className?: string;
  readonly inviteDisabled?: boolean;
}

export function InviteSearchResultList({
  results,
  onInvite,
  className,
  inviteDisabled = false,
}: InviteSearchResultListProps) {
  return (
    <ul className={cn("flex flex-col gap-3", className)} role="list">
      {results.map((result, index) => (
        <li
          key={result.id}
          className="animate-in fade-in slide-in-from-bottom-2 duration-300"
          style={{ animationDelay: `${index * 40}ms`, animationFillMode: "backwards" }}
        >
          <RegisteredUserCard result={result} onInvite={() => onInvite(result)} inviteDisabled={inviteDisabled} />
        </li>
      ))}
    </ul>
  );
}
