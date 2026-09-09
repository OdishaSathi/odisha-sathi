import { parseReminderDate } from "@/lib/reminderUrgency";

export type PublicLifecycleTone = "success" | "warning" | "danger" | "info" | "neutral";

export type PublicLifecycleStatus = {
  key: string;
  label: string;
  tone: PublicLifecycleTone;
};

type ApplicationLifecycleInput = {
  startDate?: unknown;
  lastDate?: unknown;
  fallbackStatus?: unknown;
};

type ExamLifecycleInput = {
  examDate?: unknown;
  admitCardDate?: unknown;
  fallbackStatus?: unknown;
};

type ResultLifecycleInput = {
  resultDate?: unknown;
  fallbackStatus?: unknown;
};

function normalizeStoredStatus(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

function getIndiaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value || 0);
  const month = Number(parts.find((part) => part.type === "month")?.value || 0);
  const day = Number(parts.find((part) => part.type === "day")?.value || 0);

  if (!year || !month || !day) {
    const fallback = new Date(now);
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }

  return new Date(year, month - 1, day);
}

function getDayDifference(value: unknown, now = new Date()) {
  const parsed = parseReminderDate(value);
  if (!parsed) return null;

  const today = getIndiaToday(now);
  return Math.round((parsed.getTime() - today.getTime()) / 86400000);
}

function fromApplicationFallback(value: unknown): PublicLifecycleStatus | null {
  switch (normalizeStoredStatus(value)) {
    case "upcoming":
      return { key: "upcoming", label: "Upcoming", tone: "info" };
    case "open":
      return { key: "open", label: "Open", tone: "success" };
    case "closing-soon":
      return { key: "closing-soon", label: "Closing Soon", tone: "warning" };
    case "closed":
      return { key: "closed", label: "Closed", tone: "neutral" };
    default:
      return null;
  }
}

export function getApplicationLifecycleStatus(
  input: ApplicationLifecycleInput,
  now = new Date()
): PublicLifecycleStatus | null {
  const startDays = getDayDifference(input.startDate, now);
  const lastDays = getDayDifference(input.lastDate, now);

  if (startDays !== null && startDays > 0) {
    return { key: "upcoming", label: "Upcoming", tone: "info" };
  }

  if (lastDays !== null) {
    if (lastDays < 0) {
      return { key: "closed", label: "Closed", tone: "neutral" };
    }

    if (lastDays === 0) {
      return { key: "closes-today", label: "Closes Today", tone: "danger" };
    }

    if (lastDays <= 3) {
      return { key: "closing-soon", label: "Closing Soon", tone: "warning" };
    }

    return { key: "open", label: "Open", tone: "success" };
  }

  if (startDays !== null && startDays <= 0) {
    return { key: "open", label: "Open", tone: "success" };
  }

  return fromApplicationFallback(input.fallbackStatus);
}

function fromExamFallback(value: unknown): PublicLifecycleStatus | null {
  switch (normalizeStoredStatus(value)) {
    case "scheduled":
    case "upcoming":
      return { key: "scheduled", label: "Scheduled", tone: "info" };
    case "completed":
      return { key: "completed", label: "Exam Completed", tone: "neutral" };
    case "released":
      return { key: "admit-card-released", label: "Admit Card Released", tone: "success" };
    default:
      return null;
  }
}

export function getExamLifecycleStatus(
  input: ExamLifecycleInput,
  now = new Date()
): PublicLifecycleStatus | null {
  const examDays = getDayDifference(input.examDate, now);

  if (examDays !== null) {
    if (examDays < 0) {
      return { key: "completed", label: "Exam Completed", tone: "neutral" };
    }

    if (examDays === 0) {
      return { key: "exam-today", label: "Exam Today", tone: "danger" };
    }

    if (examDays <= 7) {
      return { key: "exam-soon", label: "Exam Soon", tone: "warning" };
    }

    return { key: "scheduled", label: "Scheduled", tone: "info" };
  }

  const admitCardDays = getDayDifference(input.admitCardDate, now);
  if (admitCardDays !== null) {
    if (admitCardDays <= 0) {
      return {
        key: "admit-card-released",
        label: "Admit Card Released",
        tone: "success",
      };
    }

    return { key: "admit-card-upcoming", label: "Admit Card Soon", tone: "info" };
  }

  return fromExamFallback(input.fallbackStatus);
}

function fromResultFallback(value: unknown): PublicLifecycleStatus | null {
  switch (normalizeStoredStatus(value)) {
    case "released":
      return { key: "result-released", label: "Result Released", tone: "success" };
    case "upcoming":
    case "scheduled":
      return { key: "result-expected", label: "Result Expected", tone: "info" };
    default:
      return null;
  }
}

export function getResultLifecycleStatus(
  input: ResultLifecycleInput,
  now = new Date()
): PublicLifecycleStatus | null {
  const resultDays = getDayDifference(input.resultDate, now);

  if (resultDays !== null) {
    if (resultDays > 0) {
      return { key: "result-expected", label: "Result Expected", tone: "info" };
    }

    return { key: "result-released", label: "Result Released", tone: "success" };
  }

  return fromResultFallback(input.fallbackStatus);
}
