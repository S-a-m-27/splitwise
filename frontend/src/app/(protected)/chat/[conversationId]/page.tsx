import { ChatThreadPageContent } from "@/features/chat/components/chat-thread-page-content";

interface ChatThreadPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ChatThreadPage({ params }: ChatThreadPageProps) {
  const { conversationId } = await params;
  return <ChatThreadPageContent conversationId={conversationId} />;
}
