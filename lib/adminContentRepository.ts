import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const ADMIN_CONTENT_SECTIONS = [
  { key: "jobs", label: "Jobs", adminHref: "/admin/jobs" },
  { key: "admissions", label: "Admissions", adminHref: "/admin/admissions" },
  { key: "results", label: "Results", adminHref: "/admin/results" },
  {
    key: "admit-cards",
    label: "Exams & Admit Cards",
    adminHref: "/admin/admit-cards",
  },
  {
    key: "citizen-services",
    label: "Citizen Services",
    adminHref: "/admin/citizen-services",
  },
] as const;

export type AdminContentCategory =
  (typeof ADMIN_CONTENT_SECTIONS)[number]["key"];
export type AdminContentCollection = "posts" | "results" | "admitCards";

export type AdminContentRecord = {
  id: string;
  sourceCollection: AdminContentCollection;
  title: string;
  slug?: string;
  category: AdminContentCategory;
  schemeName?: string;
  department?: string;
  organization?: string;
  shortDescription?: string;
  description?: string;
  content?: string;
  status?: string;
  published?: boolean;
  subCategory?: string;
  subCategories?: string[];
  createdAt?: any;
  updatedAt?: any;
  homeLatestSelected?: boolean;
  homeLatestHidden?: boolean;
  homeLatestOrder?: number;
  lastDate?: string;
  lastDateDisplay?: string;
  applicationLastDate?: string;
  applyLastDate?: string;
  applicationEndDate?: string;
  closingDate?: string;
  endDate?: string;
  deadline?: string;
  examDate?: string;
  examDateDisplay?: string;
  importantDates?: Array<{ label?: string; value?: string }>;
  importantLinks?: Array<{
    label?: string;
    title?: string;
    url?: string;
    href?: string;
  }>;
  links?: Array<{
    label?: string;
    title?: string;
    url?: string;
    href?: string;
  }>;
  sourceUrl?: string;
  canonicalStartDate?: string;
  canonicalLastDate?: string;
  canonicalExamDate?: string;
  canonicalResultDate?: string;
  lifecycleStatus?: string;
  sourceReferenceStatus?: string;
  sourceReferenceType?: string;
  sourceReferenceLabel?: string;
  sourceReferenceUrl?: string;
  dataQualityVersion?: number;
  [key: string]: any;
};

const MAIN_CATEGORY_KEYS = new Set<string>(
  ADMIN_CONTENT_SECTIONS.map((section) => section.key)
);
const POST_COLLECTION_CATEGORIES = new Set<AdminContentCategory>([
  "jobs",
  "admissions",
  "citizen-services",
]);

function cleanCategory(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function timestampValue(value: any) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function isMainCategory(value: string): value is AdminContentCategory {
  return MAIN_CATEGORY_KEYS.has(value);
}

function normalizeRecord(
  id: string,
  sourceCollection: AdminContentCollection,
  rawData: Record<string, any>
): AdminContentRecord | null {
  const category =
    sourceCollection === "results"
      ? "results"
      : sourceCollection === "admitCards"
      ? "admit-cards"
      : cleanCategory(rawData.category);

  if (!isMainCategory(category)) return null;
  if (
    sourceCollection === "posts" &&
    !POST_COLLECTION_CATEGORIES.has(category)
  ) {
    return null;
  }

  return {
    ...rawData,
    id,
    sourceCollection,
    category,
    title: String(rawData.title || rawData.schemeName || "Untitled Post").trim(),
    slug: String(rawData.slug || "").trim(),
    subCategory: String(rawData.subCategory || "").trim(),
    subCategories: Array.isArray(rawData.subCategories)
      ? rawData.subCategories
          .map((item: unknown) => String(item || "").trim())
          .filter(Boolean)
      : [],
  };
}

export function getAdminContentRecordKey(record: {
  id: string;
  sourceCollection: AdminContentCollection;
}) {
  return `${record.sourceCollection}:${record.id}`;
}

export function getAdminContentCategoryLabel(category: string) {
  return (
    ADMIN_CONTENT_SECTIONS.find((section) => section.key === category)?.label ||
    category.replace(/-/g, " ")
  );
}

export async function getAdminContentRecords(): Promise<AdminContentRecord[]> {
  const sources: Array<{
    collectionName: AdminContentCollection;
  }> = [
    { collectionName: "posts" },
    { collectionName: "results" },
    { collectionName: "admitCards" },
  ];

  const snapshots = await Promise.all(
    sources.map(({ collectionName }) =>
      getDocs(collection(db, collectionName))
    )
  );

  return snapshots
    .flatMap((snapshot, sourceIndex) =>
      snapshot.docs
        .map((item) =>
          normalizeRecord(
            item.id,
            sources[sourceIndex].collectionName,
            item.data()
          )
        )
        .filter((item): item is AdminContentRecord => Boolean(item))
    )
    .sort(
      (a, b) =>
        Math.max(timestampValue(b.updatedAt), timestampValue(b.createdAt)) -
        Math.max(timestampValue(a.updatedAt), timestampValue(a.createdAt))
    );
}

export async function getAdminContentOverview() {
  const [records, importantSnapshot] = await Promise.all([
    getAdminContentRecords(),
    getDocs(collection(db, "importantInformation")),
  ]);

  return {
    records,
    importantInformationCount: importantSnapshot.size,
  };
}

export async function updateAdminContentRecord(
  record: Pick<AdminContentRecord, "id" | "sourceCollection">,
  changes: Record<string, unknown>
) {
  return updateDoc(doc(db, record.sourceCollection, record.id), changes);
}
