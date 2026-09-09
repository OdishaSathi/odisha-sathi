import "server-only";

import { collection, getDocs } from "firebase/firestore";
import { unstable_cache } from "next/cache";
import { dbServer } from "@/lib/firebaseServer";
import { isPublicListingPost } from "@/lib/publicPostQuality";
import type { SearchImportantDate, SearchResultRecord } from "@/lib/searchTypes";

type SearchCollection = {
  name: string;
  category?: string;
};

type IndexedSearchRecord = SearchResultRecord & {
  titleSearch: string;
  strongSearch: string;
  mediumSearch: string;
  broadSearch: string;
};

const SEARCH_COLLECTIONS: SearchCollection[] = [
  { name: "posts" },
  { name: "jobs", category: "jobs" },
  { name: "admissions", category: "admissions" },
  { name: "admitCards", category: "admit-cards" },
  { name: "admit-cards", category: "admit-cards" },
  { name: "admitcards", category: "admit-cards" },
  { name: "results", category: "results" },
  { name: "result", category: "results" },
  { name: "schemes", category: "schemes" },
  { name: "scheme", category: "schemes" },
  { name: "governmentSchemes", category: "schemes" },
  { name: "government-schemes", category: "schemes" },
  { name: "importantInformation", category: "important-information" },
];

const EXCLUDED_CATEGORIES = new Set(["scheme-category"]);

function cleanPlainText(value: unknown) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSearchText(value: unknown) {
  return cleanPlainText(value)
    .toLowerCase()
    .replace(/\+\s*2/g, " plus2 ")
    .replace(/\+\s*3/g, " plus3 ")
    .replace(/class\s*10/g, " class10 ")
    .replace(/class\s*12/g, " class12 ")
    .replace(/higher\s*secondary/g, " highersecondary ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCategory(value: unknown) {
  const category = normalizeSearchText(value).replace(/\s+/g, "-");

  if (["job", "jobs"].includes(category)) return "jobs";
  if (["admission", "admissions"].includes(category)) return "admissions";
  if (["result", "results"].includes(category)) return "results";
  if (
    ["admit-card", "admit-cards", "admitcard", "admitcards", "exam", "exams"].includes(
      category
    )
  ) {
    return "admit-cards";
  }
  if (
    [
      "scheme",
      "schemes",
      "government-scheme",
      "government-schemes",
      "scholarship",
      "scholarships",
    ].includes(category)
  ) {
    return "schemes";
  }
  if (["citizen-service", "citizen-services"].includes(category)) {
    return "citizen-services";
  }
  if (["important-information", "importantinformation"].includes(category)) {
    return "important-information";
  }
  if (["tool", "tools"].includes(category)) return "tools";
  if (["pdf-tool", "pdf-tools"].includes(category)) return "pdf-tools";
  if (["image-tool", "image-tools"].includes(category)) return "image-tools";

  return category;
}

function getMillis(value: any) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? 0 : value.getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (typeof value?.toMillis === "function") {
    try {
      return value.toMillis();
    } catch {
      return 0;
    }
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }
  return 0;
}

function cleanImportantDates(value: unknown): SearchImportantDate[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item: any) => ({
      label: cleanPlainText(item?.label || item?.type),
      type: cleanPlainText(item?.type || item?.label),
      value: cleanPlainText(item?.value || item?.date || item?.dateText),
    }))
    .filter((item) => item.value)
    .slice(0, 20);
}

function flattenValues(value: unknown, keys: string[]) {
  if (!Array.isArray(value)) return "";

  return value
    .flatMap((item: any) => {
      if (typeof item === "string") return [item];
      if (!item || typeof item !== "object") return [];
      return keys.map((key) => item?.[key]).filter(Boolean);
    })
    .map(cleanPlainText)
    .filter(Boolean)
    .join(" ");
}

function getDisplayTitle(data: Record<string, any>) {
  return cleanPlainText(data.title || data.schemeName || data.toolName || "");
}

function getRecordRoute(record: SearchResultRecord) {
  const identifier = record.slug || record.id;

  if (record.externalUrl) return record.externalUrl;
  if (record.category === "important-information") {
    return `/important-information/${identifier}`;
  }
  if (record.category === "citizen-services") {
    return `/citizen-services/${identifier}`;
  }
  if (record.category === "pdf-tools") return "/tools/pdf-tools";
  if (record.category === "image-tools") return "/tools/image-tools";
  if (record.category === "tools") {
    return record.toolCategory === "image-tools" ? "/tools/image-tools" : "/tools/pdf-tools";
  }
  return `/post/${identifier}`;
}

function makeIndexedRecord(
  id: string,
  data: Record<string, any>,
  categoryOverride?: string
): IndexedSearchRecord | null {
  const rawCategory = categoryOverride || data.category || data.type || "";
  const category = normalizeCategory(rawCategory);
  const title = getDisplayTitle(data);

  if (!title || EXCLUDED_CATEGORIES.has(category)) return null;

  const qualityData = {
    ...data,
    category: category || data.category,
    title,
  };

  if (!isPublicListingPost(qualityData, id)) return null;

  const importantDates = cleanImportantDates(data.importantDates);
  const panels = flattenValues(data.jobInfoPanels || data.quickInfoPanels, [
    "organization",
    "department",
    "postName",
    "totalVacancy",
    "qualification",
    "ageLimit",
    "salary",
    "payScale",
  ]);
  const quickRows = flattenValues(data.quickInfoRows || data.overviewRows, [
    "label",
    "value",
  ]);
  const sections = flattenValues(data.contentSections || data.detailSections, [
    "title",
    "heading",
    "content",
  ]);
  const tableText = flattenValues(data.dataTables, ["title", "heading"]);
  const keywords = Array.isArray(data.referenceKeywords)
    ? data.referenceKeywords.join(" ")
    : data.referenceKeywords || "";
  const subCategories = Array.isArray(data.subCategories)
    ? data.subCategories.join(" ")
    : "";

  const description = cleanPlainText(
    data.shortDescription ||
      data.description ||
      data.content ||
      data.details ||
      data.excerpt ||
      ""
  );

  const record: SearchResultRecord = {
    id,
    title,
    slug: cleanPlainText(data.slug),
    category,
    description,
    organization: cleanPlainText(data.organization),
    department: cleanPlainText(data.department),
    examName: cleanPlainText(data.examName),
    status: cleanPlainText(data.status),
    lifecycleStatus: cleanPlainText(data.lifecycleStatus),
    toolName: cleanPlainText(data.toolName),
    toolCategory: normalizeCategory(data.toolCategory),
    externalUrl:
      category === "tools" || category === "pdf-tools" || category === "image-tools"
        ? cleanPlainText(data.toolUrl || data.externalUrl || data.url)
        : "",
    startDate: cleanPlainText(
      data.canonicalStartDate ||
        data.startDateDisplay ||
        data.startDate ||
        data.applicationStartDateDisplay ||
        data.applicationStartDate ||
        data.openingDate
    ),
    lastDate: cleanPlainText(
      data.canonicalLastDate ||
        data.lastDateDisplay ||
        data.lastDate ||
        data.applicationLastDate ||
        data.applicationEndDate ||
        data.closingDate ||
        data.endDate
    ),
    examDate: cleanPlainText(
      data.canonicalExamDate ||
        data.examDateDisplay ||
        data.examDate ||
        data.admitCardDateDisplay ||
        data.admitCardDate ||
        data.releaseDate
    ),
    resultDate: cleanPlainText(
      data.canonicalResultDate || data.resultDateDisplay || data.resultDate
    ),
    importantDates,
    createdAtMs: getMillis(data.createdAt),
    updatedAtMs: getMillis(data.updatedAt),
  };

  const strongText = [
    data.schemeName,
    data.toolName,
    data.postName,
    data.examName,
    data.notificationNumber,
    data.subCategory,
    data.subCategoryLabel,
    subCategories,
    keywords,
    panels,
    quickRows,
  ]
    .map(cleanPlainText)
    .filter(Boolean)
    .join(" ");

  const mediumText = [
    data.organization,
    data.department,
    data.qualification,
    data.courseName,
    data.category,
    data.toolCategory,
    sections,
    tableText,
    category,
  ]
    .map(cleanPlainText)
    .filter(Boolean)
    .join(" ");

  const broadText = [
    description,
    data.eligibility,
    data.benefits,
    data.fees,
    data.howToApply,
    data.selectionProcedure,
    data.examPattern,
    data.syllabus,
    importantDates.map((item) => `${item.label || ""} ${item.value || ""}`).join(" "),
  ]
    .map(cleanPlainText)
    .filter(Boolean)
    .join(" ");

  return {
    ...record,
    titleSearch: normalizeSearchText(title),
    strongSearch: normalizeSearchText(strongText),
    mediumSearch: normalizeSearchText(mediumText),
    broadSearch: normalizeSearchText(broadText),
  };
}

async function loadPublicSearchIndexUncached(): Promise<IndexedSearchRecord[]> {
  const groups = await Promise.all(
    SEARCH_COLLECTIONS.map(async (source) => {
      try {
        const snapshot = await getDocs(collection(dbServer, source.name));
        return snapshot.docs
          .map((item) => makeIndexedRecord(item.id, item.data(), source.category))
          .filter((item): item is IndexedSearchRecord => Boolean(item));
      } catch (error) {
        console.warn(`Search index skipped ${source.name}`, error);
        return [] as IndexedSearchRecord[];
      }
    })
  );

  const deduped = new Map<string, IndexedSearchRecord>();

  groups.flat().forEach((record) => {
    const route = getRecordRoute(record);
    const key = normalizeSearchText(route || `${record.category}-${record.title}`);
    const previous = deduped.get(key);
    const nextTime = Math.max(record.updatedAtMs || 0, record.createdAtMs || 0);
    const previousTime = Math.max(previous?.updatedAtMs || 0, previous?.createdAtMs || 0);

    if (!previous || nextTime >= previousTime) {
      deduped.set(key, record);
    }
  });

  return [...deduped.values()];
}

const loadPublicSearchIndex = unstable_cache(
  loadPublicSearchIndexUncached,
  ["odisha-sathi-public-search-index-v1"],
  { revalidate: 300 }
);

function tokenAlternatives(token: string) {
  const groups: string[][] = [
    ["10th", "matric", "class10"],
    ["12th", "plus2", "class12", "highersecondary"],
    ["plus3", "degree", "graduation", "graduate"],
    ["admitcard", "admit", "hallticket"],
  ];

  const group = groups.find((items) => items.includes(token));
  return group || [token];
}

function getQueryTokens(query: string) {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  return normalized
    .split(" ")
    .map((item) => item.trim())
    .filter((item) => item.length >= 2 || /^\d+$/.test(item));
}

function textHasToken(text: string, token: string) {
  return tokenAlternatives(token).some((candidate) => text.includes(candidate));
}

function scoreRecord(record: IndexedSearchRecord, query: string) {
  const phrase = normalizeSearchText(query);
  const tokens = getQueryTokens(query);
  if (!phrase || tokens.length === 0) return 0;

  const combined = `${record.titleSearch} ${record.strongSearch} ${record.mediumSearch} ${record.broadSearch}`;
  const matchingTokens = tokens.filter((token) => textHasToken(combined, token));

  if (matchingTokens.length !== tokens.length) return 0;

  let score = 0;

  if (record.titleSearch === phrase) score += 1000;
  else if (record.titleSearch.startsWith(phrase)) score += 320;
  else if (record.titleSearch.includes(phrase)) score += 220;

  if (record.strongSearch.includes(phrase)) score += 160;
  if (record.mediumSearch.includes(phrase)) score += 90;
  if (record.broadSearch.includes(phrase)) score += 35;

  tokens.forEach((token) => {
    if (textHasToken(record.titleSearch, token)) score += 70;
    if (textHasToken(record.strongSearch, token)) score += 45;
    if (textHasToken(record.mediumSearch, token)) score += 25;
    if (textHasToken(record.broadSearch, token)) score += 8;
  });

  const recencyTime = Math.max(record.updatedAtMs || 0, record.createdAtMs || 0);
  if (recencyTime > 0) {
    const ageDays = Math.max(0, (Date.now() - recencyTime) / 86400000);
    score += Math.max(0, 20 - ageDays / 30);
  }

  return score;
}

export async function searchPublicRecords(query: string): Promise<SearchResultRecord[]> {
  const cleanQuery = cleanPlainText(query);
  if (!cleanQuery) return [];

  const index = await loadPublicSearchIndex();

  return index
    .map((record) => ({ record, score: scoreRecord(record, cleanQuery) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const bTime = Math.max(b.record.updatedAtMs || 0, b.record.createdAtMs || 0);
      const aTime = Math.max(a.record.updatedAtMs || 0, a.record.createdAtMs || 0);
      return bTime - aTime;
    })
    .map(({ record }) => {
      const { titleSearch, strongSearch, mediumSearch, broadSearch, ...publicRecord } = record;
      return publicRecord;
    });
}
