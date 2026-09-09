export type CitizenServiceSearchable = {
  title?: string;
  subCategory?: string;
  subCategoryLabel?: string;
  shortDescription?: string;
  searchText?: string;
  createdAt?: any;
};

const MAX_FLATTEN_DEPTH = 5;

function collectText(value: unknown, output: string[], depth = 0) {
  if (depth > MAX_FLATTEN_DEPTH || value == null) return;

  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    if (text) output.push(text);
    return;
  }

  if (typeof value === "boolean") return;

  if (Array.isArray(value)) {
    value.forEach((item) => collectText(item, output, depth + 1));
    return;
  }

  if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      // Timestamp-like objects and internal IDs add noise but no discovery value.
      if (["seconds", "nanoseconds", "id", "createdAt", "updatedAt"].includes(key)) {
        return;
      }
      collectText(item, output, depth + 1);
    });
  }
}

export function normalizeCitizenServiceSearch(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/\+\s*2\b/g, " plus2 ")
    .replace(/\bplus\s*2\b/g, " plus2 ")
    .replace(/\b12th\b/g, " plus2 ")
    .replace(/\bclass\s*12\b/g, " plus2 ")
    .replace(/\b10th\b/g, " matric10 ")
    .replace(/\bclass\s*10\b/g, " matric10 ")
    .replace(/\bmatric(?:ulation)?\b/g, " matric10 ")
    .replace(/\badhar\b/g, " aadhaar ")
    .replace(/\blabor\b/g, " labour ")
    .normalize("NFKD")
    .replace(/[^a-z0-9\u0B00-\u0B7F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildCitizenServiceSearchText(data: Record<string, unknown>) {
  const searchableKeys = [
    "title",
    "slug",
    "subCategory",
    "subCategoryLabel",
    "subCategories",
    "shortDescription",
    "description",
    "notificationNumber",
    "overviewRows",
    "contentSections",
    "dataTables",
    "documentsRequired",
    "eligibility",
    "fees",
    "howToApply",
    "importantDates",
    "importantLinks",
    "shareTitle",
    "shareDescription",
  ];

  const parts: string[] = [];
  searchableKeys.forEach((key) => collectText(data[key], parts));
  return normalizeCitizenServiceSearch(parts.join(" "));
}

function getCreatedTime(item: CitizenServiceSearchable) {
  const seconds = Number(item.createdAt?.seconds || 0);
  if (Number.isFinite(seconds) && seconds > 0) return seconds;

  const millis = new Date(item.createdAt || 0).getTime();
  return Number.isFinite(millis) ? millis / 1000 : 0;
}

function getQueryTokens(query: string) {
  return normalizeCitizenServiceSearch(query)
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);
}

function tokenMatches(text: string, token: string) {
  if (text.includes(token)) return true;

  const synonyms: Record<string, string[]> = {
    worker: ["labour"],
    labour: ["worker"],
    student: ["scholarship", "education"],
    scholarship: ["student"],
    farmer: ["agriculture", "krushak", "kisan"],
    agriculture: ["farmer", "krushak", "kisan"],
    residence: ["resident", "domicile"],
    resident: ["residence", "domicile"],
  };

  return (synonyms[token] || []).some((alternate) => text.includes(alternate));
}

export function citizenServiceSearchScore(
  item: CitizenServiceSearchable,
  query: string
) {
  const tokens = getQueryTokens(query);
  if (tokens.length === 0) return 0;

  const title = normalizeCitizenServiceSearch(item.title);
  const category = normalizeCitizenServiceSearch(
    `${item.subCategoryLabel || ""} ${item.subCategory || ""}`
  );
  const shortDescription = normalizeCitizenServiceSearch(item.shortDescription);
  const allText = normalizeCitizenServiceSearch(
    `${item.searchText || ""} ${title} ${category} ${shortDescription}`
  );

  if (!tokens.every((token) => tokenMatches(allText, token))) return -1;

  const normalizedQuery = normalizeCitizenServiceSearch(query);
  let score = 0;

  if (title === normalizedQuery) score += 160;
  else if (title.includes(normalizedQuery)) score += 100;

  if (tokens.every((token) => tokenMatches(title, token))) score += 60;
  if (tokens.every((token) => tokenMatches(category, token))) score += 30;
  if (tokens.every((token) => tokenMatches(shortDescription, token))) score += 18;

  tokens.forEach((token) => {
    if (tokenMatches(title, token)) score += 12;
    else if (tokenMatches(category, token)) score += 6;
    else if (tokenMatches(shortDescription, token)) score += 3;
    else score += 1;
  });

  return score;
}

export function filterCitizenServices<T extends CitizenServiceSearchable>(
  services: T[],
  query: string
) {
  if (!normalizeCitizenServiceSearch(query)) return services;

  return services
    .map((service) => ({
      service,
      score: citizenServiceSearchScore(service, query),
    }))
    .filter((item) => item.score >= 0)
    .sort(
      (a, b) =>
        b.score - a.score || getCreatedTime(b.service) - getCreatedTime(a.service)
    )
    .map((item) => item.service);
}
