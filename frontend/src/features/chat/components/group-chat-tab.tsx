"use client";

import { ChatScreen } from "@/features/chat/components/chat-screen";
import { ChatErrorState } from "@/features/chat/components/chat-error-state";
import { GroupChatLoading } from "@/features/chat/components/chat-screen";
import { useGroupConversation } from "@/features/chat/hooks/use-group-conversation";

interface GroupChatTabProps {
  groupId: string;
  groupName: string;
  groupIcon: string;
  memberCount: number;
}

export function GroupChatTab({
  groupId,
  groupName,
  groupIcon,
  memberCount,
}: GroupChatTabProps) {
  const query = useGroupConversation(groupId);
  if (query.isLoading) return <GroupChatLoading />;
  if (query.isError || !query.data) {
    return <ChatErrorState variant="messages" onRetry={() => void query.refetch()} />;
  }

  const conversation = {
    ...query.data,
    title: groupName,
    avatarIcon: groupIcon,
    memberCount,
  };
  return <ChatScreen conversation={conversation} embedded />;
}
