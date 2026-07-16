const TIME_FORMAT: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
};

const WEEKDAY_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "short",
};

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
};

function toDate(iso: string): Date {
  return new Date(iso);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isYesterday(date: Date, now: Date): boolean {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  return isSameDay(date, yesterday);
}

/** Conversation list timestamp — compact and contextual */
export function formatConversationTime(iso: string | null): string {
  if (!iso) return "";

  const date = toDate(iso);
  const now = new Date();

  if (isSameDay(date, now)) {
    return date.toLocaleTimeString(undefined, TIME_FORMAT);
  }

  if (isYesterday(date, now)) {
    return "Yesterday";
  }

  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays < 7) {
    return date.toLocaleDateString(undefined, WEEKDAY_FORMAT);
  }

  return date.toLocaleDateString(undefined, DATE_FORMAT);
}

/** Message bubble timestamp */
export function formatMessageTime(iso: string): string {
  return toDate(iso).toLocaleTimeString(undefined, TIME_FORMAT);
}

/** Date separator label */
export function formatDateSeparator(iso: string): string {
  const date = toDate(iso);
  const now = new Date();

  if (isSameDay(date, now)) return "Today";
  if (isYesterday(date, now)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function isDifferentDay(isoA: string, isoB: string): boolean {
  return !isSameDay(toDate(isoA), toDate(isoB));
}

export function withinMinutes(isoA: string, isoB: string, minutes: number): boolean {
  const diff = Math.abs(toDate(isoB).getTime() - toDate(isoA).getTime());
  return diff <= minutes * 60_000;
}
