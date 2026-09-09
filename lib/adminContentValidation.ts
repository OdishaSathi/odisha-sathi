export type ValidationDateRow = {
  label?: string;
  type?: string;
  value?: string;
};

export type ValidationLinkRow = {
  label?: string;
  type?: string;
  url?: string;
};

export type AdminContentValidationInput = {
  title?: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  importantDates?: ValidationDateRow[];
  importantLinks?: ValidationLinkRow[];
};

export type AdminValidationReport = {
  errors: string[];
  warnings: string[];
};

export type AdminValidationOptions = {
  requireSlug?: boolean;
  expectDescription?: boolean;
  expectOfficialLink?: boolean;
};

function clean(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function normalizeLabel(value: unknown) {
  return clean(value).toLowerCase();
}

function isValidDatePart(day: number, month: number, year: number) {
  if (year < 2000 || year > 2100) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function parseSingleDate(value: unknown): Date | null {
  const text = clean(value);
  if (!text) return null;

  let match = text.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (isValidDatePart(day, month, year)) return new Date(year, month - 1, day);
  }

  match = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (isValidDatePart(day, month, year)) return new Date(year, month - 1, day);
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
    if (month && isValidDatePart(day, month, year)) {
      return new Date(year, month - 1, day);
    }
  }

  return null;
}

function findDateRow(rows: ValidationDateRow[], keywords: string[]) {
  return rows.find((row) => {
    const label = normalizeLabel(`${row.label || ""} ${row.type || ""}`);
    return keywords.some((keyword) => label.includes(keyword));
  });
}

function extractKeywordDate(text: string, keywords: string[]) {
  const normalized = clean(text);
  if (!normalized) return null;

  const datePattern =
    "(?:\\d{1,2}[-/.]\\d{1,2}[-/.]\\d{4}|\\d{4}[-/.]\\d{1,2}[-/.]\\d{1,2}|\\d{1,2}\\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\s*,?\\s*\\d{4})";

  for (const keyword of keywords) {
    const expression = new RegExp(
      `${keyword.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}[^\\d]{0,45}(${datePattern})`,
      "i"
    );
    const match = normalized.match(expression);
    if (match?.[1]) {
      const parsed = parseSingleDate(match[1]);
      if (parsed) return { raw: match[1], date: parsed };
    }
  }

  return null;
}

function isUsableUrl(value: unknown) {
  const text = clean(value);
  if (!text) return false;
  if (text.startsWith("/")) return true;
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function hasOfficialLink(rows: ValidationLinkRow[]) {
  return rows.some((row) => {
    if (!isUsableUrl(row.url)) return false;
    const label = normalizeLabel(`${row.label || ""} ${row.type || ""}`);
    return /official|notification|apply|result|admit|download|status|registration/.test(
      label
    );
  });
}

function addUnique(list: string[], message: string) {
  if (!list.includes(message)) list.push(message);
}

export function validateAdminContent(
  input: AdminContentValidationInput,
  options: AdminValidationOptions = {}
): AdminValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const title = clean(input.title);
  const slug = clean(input.slug);
  const description = clean(input.description);
  const shortDescription = clean(input.shortDescription);
  const dates = Array.isArray(input.importantDates) ? input.importantDates : [];
  const links = Array.isArray(input.importantLinks) ? input.importantLinks : [];

  if (!title) addUnique(errors, "Title is required.");
  if (options.requireSlug !== false && !slug) {
    addUnique(errors, "A valid public URL slug is required.");
  }

  if (options.expectDescription && description.length < 40) {
    addUnique(
      warnings,
      "The main description is very short. Add enough information for users to understand the update."
    );
  }

  if (shortDescription && shortDescription.length < 20) {
    addUnique(
      warnings,
      "The short description is very brief. A clearer summary will improve listing and sharing quality."
    );
  }

  const dateValuesByLabel = new Map<string, Set<string>>();
  dates.forEach((row) => {
    const label = normalizeLabel(row.label || row.type);
    const value = clean(row.value);
    if (!label || !value) return;
    if (!dateValuesByLabel.has(label)) dateValuesByLabel.set(label, new Set());
    dateValuesByLabel.get(label)?.add(value.toLowerCase());
  });

  dateValuesByLabel.forEach((values, label) => {
    if (values.size > 1) {
      addUnique(
        errors,
        `Conflicting values were entered for \"${label}\": ${Array.from(values).join(
          " / "
        )}.`
      );
    }
  });

  const startRow = findDateRow(dates, ["application start", "start date", "opening"]);
  const lastRow = findDateRow(dates, ["last date", "closing", "deadline", "application end"]);
  const startDate = parseSingleDate(startRow?.value);
  const lastDate = parseSingleDate(lastRow?.value);

  if (startDate && lastDate && startDate.getTime() > lastDate.getTime()) {
    addUnique(
      errors,
      `Application start date (${clean(startRow?.value)}) is after the last date (${clean(
        lastRow?.value
      )}).`
    );
  }

  links.forEach((row) => {
    const url = clean(row.url);
    if (!url) return;
    if (!isUsableUrl(url)) {
      addUnique(
        errors,
        `Invalid URL for \"${clean(row.label || row.type) || "link"}\": ${url}`
      );
    }
  });

  if (options.expectOfficialLink && !hasOfficialLink(links)) {
    addUnique(
      warnings,
      "No usable official/apply/download link was found. Add an official source whenever available."
    );
  }

  const combinedText = `${shortDescription} ${description}`;

  if (lastDate) {
    const mentioned = extractKeywordDate(combinedText, [
      "last date",
      "closing date",
      "deadline",
      "application end date",
    ]);
    if (mentioned && dateKey(mentioned.date) !== dateKey(lastDate)) {
      addUnique(
        warnings,
        `Possible last-date mismatch: the structured date is \"${clean(
          lastRow?.value
        )}\" but the description mentions \"${mentioned.raw}\" near a deadline phrase.`
      );
    }
  }

  if (startDate) {
    const mentioned = extractKeywordDate(combinedText, [
      "start date",
      "application start date",
      "opening date",
    ]);
    if (mentioned && dateKey(mentioned.date) !== dateKey(startDate)) {
      addUnique(
        warnings,
        `Possible start-date mismatch: the structured date is \"${clean(
          startRow?.value
        )}\" but the description mentions \"${mentioned.raw}\" near a start-date phrase.`
      );
    }
  }

  return { errors, warnings };
}

export function confirmAdminValidation(report: AdminValidationReport) {
  if (report.errors.length > 0) {
    window.alert(
      `Cannot save yet:\n\n${report.errors.map((item) => `• ${item}`).join("\n")}`
    );
    return false;
  }

  if (report.warnings.length > 0) {
    return window.confirm(
      `Please review these items before publishing:\n\n${report.warnings
        .map((item) => `• ${item}`)
        .join("\n")}\n\nSave anyway?`
    );
  }

  return true;
}
