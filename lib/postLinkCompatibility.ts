export type CompatiblePostLink = {
  id?: string;
  type?: string;
  label?: string;
  url?: string;
};

const WHATSAPP_PLACEHOLDER_URL =
  "https://whatsapp.com/channel/0029Va9mvn72P59nNU9nEJ3I";

const LEGACY_LINK_FIELDS: Array<{
  fields: string[];
  label: string;
}> = [
  {
    fields: ["resultLink", "resultUrl", "checkResultLink", "checkResultUrl"],
    label: "Check Result",
  },
  {
    fields: ["admitCardLink", "admitCardUrl", "hallTicketLink", "hallTicketUrl"],
    label: "Download Admit Card",
  },
  {
    fields: ["applyLink", "applyUrl", "applicationLink", "applicationUrl"],
    label: "Apply Online",
  },
  {
    fields: ["notificationLink", "notificationUrl", "noticeLink", "noticeUrl"],
    label: "Official Notification",
  },
  {
    fields: ["answerKeyLink", "answerKeyUrl"],
    label: "Answer Key",
  },
  {
    fields: ["meritListLink", "meritListUrl"],
    label: "Merit List",
  },
  {
    fields: ["downloadLink", "downloadUrl", "pdfLink", "pdfUrl"],
    label: "Download",
  },
  {
    fields: ["officialWebsite", "officialWebsiteUrl", "websiteUrl", "sourceUrl"],
    label: "Official Website",
  },
];

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUrlForComparison(value: string) {
  return value.trim().replace(/\/+$/, "").toLowerCase();
}

function isKnownWhatsAppPlaceholder(row: CompatiblePostLink) {
  const url = cleanString(row.url);
  const text = `${cleanString(row.type)} ${cleanString(row.label)}`.toLowerCase();

  return (
    normalizeUrlForComparison(url) ===
      normalizeUrlForComparison(WHATSAPP_PLACEHOLDER_URL) &&
    !text.includes("whatsapp")
  );
}

function normalizeRow(
  value: unknown,
  index: number,
  fallbackLabel = "Official Link"
): CompatiblePostLink | null {
  if (typeof value === "string") {
    const url = cleanString(value);
    if (!url) return null;

    return {
      id: `compatible_link_${index}`,
      type: fallbackLabel,
      label: fallbackLabel,
      url,
    };
  }

  if (!value || typeof value !== "object") return null;

  const item = value as Record<string, unknown>;
  const type = cleanString(item.type);
  const label = cleanString(item.label) || type || fallbackLabel;
  const url =
    cleanString(item.url) ||
    cleanString(item.href) ||
    cleanString(item.link) ||
    cleanString(item.value);

  if (!url) return null;

  return {
    id: cleanString(item.id) || `compatible_link_${index}`,
    type: type || label,
    label,
    url,
  };
}

export function normalizeCompatiblePostLinks(
  data: Record<string, unknown> | null | undefined
): CompatiblePostLink[] {
  if (!data) return [];

  const candidates: CompatiblePostLink[] = [];
  let index = 0;

  ["importantLinks", "links", "extraLinks"].forEach((field) => {
    const value = data[field];
    if (!Array.isArray(value)) return;

    value.forEach((item) => {
      const row = normalizeRow(item, index++);
      if (row) candidates.push(row);
    });
  });

  LEGACY_LINK_FIELDS.forEach(({ fields, label }) => {
    const value = fields.map((field) => cleanString(data[field])).find(Boolean);
    if (!value) return;

    const row = normalizeRow(value, index++, label);
    if (row) candidates.push(row);
  });

  const seen = new Set<string>();

  return candidates.filter((row) => {
    if (isKnownWhatsAppPlaceholder(row)) return false;

    const url = cleanString(row.url);
    if (!url) return false;

    const label = cleanString(row.label) || cleanString(row.type);
    const key = `${label.toLowerCase()}|${normalizeUrlForComparison(url)}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function toStoredPostLinks(value: CompatiblePostLink[]) {
  return normalizeCompatiblePostLinks({ importantLinks: value }).map((row) => ({
    id: row.id,
    type: row.type,
    label: row.label,
    url: row.url,
  }));
}
