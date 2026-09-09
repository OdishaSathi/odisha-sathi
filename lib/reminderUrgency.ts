function normalizeDate(date: Date) {
  const clean = new Date(date);
  clean.setHours(0, 0, 0, 0);
  return clean;
}

export function parseReminderDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return normalizeDate(value);
  }

  if (typeof value === "object" && value !== null) {
    const maybeTimestamp = value as { seconds?: number; toDate?: () => Date };

    if (typeof maybeTimestamp.seconds === "number") {
      return normalizeDate(new Date(maybeTimestamp.seconds * 1000));
    }

    if (typeof maybeTimestamp.toDate === "function") {
      const converted = maybeTimestamp.toDate();
      return Number.isNaN(converted.getTime()) ? null : normalizeDate(converted);
    }
  }

  if (typeof value !== "string") return null;

  const text = value.trim();
  if (!text) return null;

  let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return normalizeDate(parsed);
    }
  }

  match = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return normalizeDate(parsed);
    }
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : normalizeDate(parsed);
}

export function getDaysUntilReminder(value: unknown, now = new Date()) {
  const date = parseReminderDate(value);
  if (!date) return null;

  const today = normalizeDate(now);
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

export function getDeadlineUrgencyText(value: unknown, now = new Date()) {
  const days = getDaysUntilReminder(value, now);
  if (days === null || days < 0) return "";
  if (days === 0) return "Closes today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export function getUpcomingUrgencyText(value: unknown, now = new Date()) {
  const days = getDaysUntilReminder(value, now);
  if (days === null || days < 0) return "";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}
