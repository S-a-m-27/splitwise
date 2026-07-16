import type { ConversationMember } from "@/features/chat/types";

export interface ActiveMention {
  start: number;
  end: number;
  query: string;
}

export interface MentionSegment {
  text: string;
  mentioned: boolean;
}

export function getMemberMentionLabel(member: ConversationMember): string {
  return member.displayName?.trim() || member.email || "Unknown user";
}

export function findActiveMention(
  value: string,
  cursorPosition: number,
): ActiveMention | null {
  const beforeCursor = value.slice(0, cursorPosition);
  const match = beforeCursor.match(/(?:^|\s)@([^\s@\n]{0,40})$/);
  if (!match) return null;
  const query = match[1] ?? "";
  const atIndex = beforeCursor.lastIndexOf("@");
  if (atIndex < 0) return null;
  return { start: atIndex, end: cursorPosition, query };
}

export function insertMention(
  value: string,
  activeMention: ActiveMention,
  label: string,
): { value: string; cursorPosition: number } {
  const token = `@${label} `;
  const nextValue =
    value.slice(0, activeMention.start) + token + value.slice(activeMention.end);
  return {
    value: nextValue,
    cursorPosition: activeMention.start + token.length,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildMentionSegments(
  content: string,
  labels: string[],
): MentionSegment[] {
  const normalizedLabels = [
    ...new Set(labels.map((label) => label.trim()).filter(Boolean)),
  ].sort((a, b) => b.length - a.length);
  if (normalizedLabels.length === 0) return [{ text: content, mentioned: false }];

  const expression = new RegExp(
    `(@(?:${normalizedLabels.map(escapeRegExp).join("|")}))(?![\\p{L}\\p{N}_])`,
    "giu",
  );
  const segments: MentionSegment[] = [];
  let previousIndex = 0;
  for (const match of content.matchAll(expression)) {
    const index = match.index ?? 0;
    if (index > previousIndex) {
      segments.push({
        text: content.slice(previousIndex, index),
        mentioned: false,
      });
    }
    segments.push({ text: match[0], mentioned: true });
    previousIndex = index + match[0].length;
  }
  if (previousIndex < content.length) {
    segments.push({ text: content.slice(previousIndex), mentioned: false });
  }
  return segments.length > 0 ? segments : [{ text: content, mentioned: false }];
}
