"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ConversationSearch } from "@/features/chat/components/conversation-search";
import { useOpenConversation } from "@/features/chat/hooks/use-open-conversation";
import type { ConversationSearchResult } from "@/features/chat/types/ui";

interface NewChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewChatSheet({ open, onOpenChange }: NewChatSheetProps) {
  const [query, setQuery] = useState("");
  const openConversation = useOpenConversation();

  async function handleSelect(result: ConversationSearchResult) {
    try {
      await openConversation(result);
      onOpenChange(false);
      setQuery("");
    } catch {
      toast.error("Unable to start this conversation.");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] rounded-t-3xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 min-[375px]:px-5"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-heading text-lg">New message</SheetTitle>
          <SheetDescription>
            Search for people or groups to start a conversation.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          <ConversationSearch
            value={query}
            onChange={setQuery}
            onSelect={(result) => void handleSelect(result)}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
