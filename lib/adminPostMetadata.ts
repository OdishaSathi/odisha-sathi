export type AdminMetadataDateRow = {
  label?: string;
  type?: string;
  value?: string;
};

export type AdminMetadataLinkRow = {
  label?: string;
  type?: string;
  url?: string;
};

export type AdminPostMetadataInput = {
  importantDates?: AdminMetadataDateRow[];
  importantLinks?: AdminMetadataLinkRow[];
  now?: Date;
};

function clean(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLabel(value: unknown) {
  return clean(value).toLowerCase();
}

function toIsoDate(date: Date | null) {
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function parseDateValue(value: unknown): Date | null {
  const text = clean(value);
  if (!text) return null;

  let match = text.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
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
      return parsed;
    }
  }

  match = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/);
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
      return parsed;
    }
  }

  const monthMap: Record<string, number> = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  };

  match = text.match(
    /\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*,?\s*(\d{4})\b/i
  );
  if (match) {
    const day = Number(match[1]);
    const month = monthMap[match[2].toLowerCase()];
    const year = Number(match[3]);
    const parsed = new Date(year, month - 1, day);
    if (
      month &&
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return parsed;
    }
  }

  return null;
}

function findDate(rows: AdminMetadataDateRow[], keywords: string[]) {
  for (const row of rows) {
    const label = normalizeLabel(`${row.label || ""} ${row.type || ""}`);
    if (!keywords.some((keyword) => label.includes(keyword))) continue;
    const parsed = parseDateValue(row.value);
    if (parsed) return parsed;
  }
  return null;
}

function getSourceReference(rows: AdminMetadataLinkRow[]) {
  const candidates = rows
    .map((row) => ({
      label: clean(row.label || row.type),
      url: clean(row.url),
    }))
    .filter((row) => row.url);

  if (candidates.length === 0) {
    return {
      sourceReferenceStatus: "missing",
      sourceReferenceType: "",
      sourceReferenceLabel: "",
      sourceReferenceUrl: "",
    };
  }

  const preferred =
    candidates.find((row) => /official notification|notification|guideline|prospectus/i.test(row.label)) ||
    candidates.find((row) => /official website|official site|government portal/i.test(row.label)) ||
    candidates.find((row) => /apply|result|admit|download|status/i.test(row.label)) ||
    candidates[0];

  let sourceReferenceType = "other";
  if (/notification|guideline|prospectus|pdf/i.test(preferred.label)) {
    sourceReferenceType = "official-document";
  } else if (/official website|official site|government portal/i.test(preferred.label)) {
    sourceReferenceType = "official-website";
  } else if (/apply|registration/i.test(preferred.label)) {
    sourceReferenceType = "application-portal";
  }

  return {
    sourceReferenceStatus: "linked",
    sourceReferenceType,
    sourceReferenceLabel: preferred.label,
    sourceReferenceUrl: preferred.url,
  };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function buildAdminPostMetadata(input: AdminPostMetadataInput = {}) {
  const dates = Array.isArray(input.importantDates) ? input.importantDates : [];
  const links = Array.isArray(input.importantLinks) ? input.importantLinks : [];
  const now = startOfDay(input.now || new Date());

  const startDate = findDate(dates, ["application start", "start date", "opening"]);
  const lastDate = findDate(dates, ["last date", "closing", "deadline", "application end"]);
  const examDate = findDate(dates, ["exam date", "examination date", "test date"]);
  const resultDate = findDate(dates, ["result date", "publication date"]);

  let lifecycleStatus = "active";
  if (lastDate) {
    const daysUntilLastDate = Math.ceil((startOfDay(lastDate).getTime() - now.getTime()) / 86400000);
    if (daysUntilLastDate < 0) lifecycleStatus = "closed";
    else if (daysUntilLastDate <= 2) lifecycleStatus = "closing-soon";
    else if (startDate && startOfDay(startDate).getTime() > now.getTime()) lifecycleStatus = "upcoming";
    else lifecycleStatus = "open";
  } else if (examDate) {
    lifecycleStatus = startOfDay(examDate).getTime() >= now.getTime() ? "scheduled" : "completed";
  } else if (resultDate) {
    lifecycleStatus = startOfDay(resultDate).getTime() <= now.getTime() ? "released" : "upcoming";
  }

  return {
    canonicalStartDate: toIsoDate(startDate),
    canonicalLastDate: toIsoDate(lastDate),
    canonicalExamDate: toIsoDate(examDate),
    canonicalResultDate: toIsoDate(resultDate),
    lifecycleStatus,
    dataQualityVersion: 1,
    ...getSourceReference(links),
  };
}
