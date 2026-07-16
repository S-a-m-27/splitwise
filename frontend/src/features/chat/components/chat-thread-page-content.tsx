"use client";

import { ROUTES } from "@/constants/routes";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { ChatScreen } from "@/features/chat/components/chat-screen";

interface ChatThreadPageContentProps {
  conversationId: string;
}

export function ChatThreadPageContent({ conversationId }: ChatThreadPageContentProps) {
  return (
    <DashboardShell hideNav>
      <div className="mx-auto h-[100dvh] w-full max-w-5xl">
        <ChatScreen
          conversationId={conversationId}
          className="h-[100dvh]"
          backHref={ROUTES.chat}
          backLabel="Back to messages"
        />
      </div>
    </DashboardShell>
  );
}
