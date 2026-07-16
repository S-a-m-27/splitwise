"use client";

import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { ChatFab } from "@/features/chat/components/chat-fab";
import { ConversationList } from "@/features/chat/components/conversation-list";
import { ConversationListSkeleton } from "@/features/chat/components/chat-skeleton";
import { ConversationSearch } from "@/features/chat/components/conversation-search";
import { EmptyConversationState } from "@/features/chat/components/empty-conversation-state";
import { ChatErrorState } from "@/features/chat/components/chat-error-state";
import { NewChatSheet } from "@/features/chat/components/new-chat-sheet";
import { useConversations } from "@/features/chat/hooks/use-conversations";
import { useOpenConversation } from "@/features/chat/hooks/use-open-conversation";
import type { ConversationSearchResult } from "@/features/chat/types/ui";
import { PageHeader, PageStack } from "@/components/layout/page-layout";

export function ConversationsPageContent() {
  const { conversations, isLoading, isError, refetch, isEmpty } = useConversations();
  const [searchQuery, setSearchQuery] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const openConversation = useOpenConversation();

  async function handleSearchSelect(result: ConversationSearchResult) {
    try {
      await openConversation(result);
      setSearchQuery("");
    } catch {
      toast.error("Unable to open this conversation.");
    }
  }

  return (
    <DashboardShell>
      <PageStack className="pb-4">
        <PageHeader
          title="Messages"
          description="Chat with your groups and friends in one place."
        />

        <ConversationSearch
          value={searchQuery}
          onChange={setSearchQuery}
          onSelect={(result) => void handleSearchSelect(result)}
        />

        {isError && (
          <ChatErrorState variant="connection" onRetry={refetch} />
        )}

        {!isError && isLoading && <ConversationListSkeleton />}

        {!isError && !isLoading && isEmpty && (
          <EmptyConversationState
            actionLabel="Start a chat"
            onAction={() => setNewChatOpen(true)}
          />
        )}

        {!isError && !isLoading && !isEmpty && !searchQuery && (
          <ConversationList conversations={conversations} />
        )}
      </PageStack>

      {!isEmpty && !isLoading && (
        <ChatFab onClick={() => setNewChatOpen(true)} />
      )}

      <NewChatSheet open={newChatOpen} onOpenChange={setNewChatOpen} />
    </DashboardShell>
  );
}
