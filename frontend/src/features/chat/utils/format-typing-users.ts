export function formatTypingUsers(names: string[]): string | null {
  const uniqueNames = [...new Set(names.filter(Boolean))];
  if (uniqueNames.length === 0) return null;
  if (uniqueNames.length === 1) return `${uniqueNames[0]} is typing…`;
  if (uniqueNames.length === 2) {
    return `${uniqueNames[0]} and ${uniqueNames[1]} are typing…`;
  }
  return `${uniqueNames.length} people are typing…`;
}
