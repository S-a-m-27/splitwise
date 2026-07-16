import { buildMentionSegments } from "@/features/chat/utils/mentions";
import { cn } from "@/lib/utils";

interface MessageContentProps {
  content: string;
  mentionLabels?: string[];
  isOwn?: boolean;
}

export function MessageContent({
  content,
  mentionLabels = [],
  isOwn = false,
}: MessageContentProps) {
  const segments = buildMentionSegments(content, mentionLabels);
  return (
    <p className="whitespace-pre-wrap break-words">
      {segments.map((segment, index) =>
        segment.mentioned ? (
          <span
            key={`${index}-${segment.text}`}
            className={cn(
              "rounded-md px-1 py-0.5 font-semibold",
              isOwn
                ? "bg-white/15 text-primary-foreground"
                : "bg-primary/10 text-primary",
            )}
          >
            {segment.text}
          </span>
        ) : (
          segment.text
        ),
      )}
    </p>
  );
}
