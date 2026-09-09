import type {
  FlexibleDataTable,
  FlexibleDetailSection,
} from "@/lib/flexibleDetails";
import type {
  ImportantDateRow,
  ImportantLinkRow,
} from "@/lib/postOptions";

export type ServiceOverviewRow = {
  id: string;
  label: string;
  value: string;
  labelOdia?: string;
  valueOdia?: string;
};

export type ServiceDocumentRow = {
  id: string;
  name: string;
  nameOdia?: string;
};

export type CitizenServicePost = {
  id?: string;
  title: string;
  slug: string;
  category: "citizen-services";
  subCategory: string;
  subCategoryLabel: string;
  subCategories: string[];
  shortDescription: string;
  description: string;
  titleOdia?: string;
  shortDescriptionOdia?: string;
  descriptionOdia?: string;
  notificationNumber: string;
  previewImageUrl: string;
  overviewRows: ServiceOverviewRow[];
  contentSections: FlexibleDetailSection[];
  dataTables: FlexibleDataTable[];
  documentsRequired: ServiceDocumentRow[];
  eligibility: string;
  fees: string;
  howToApply: string;
  eligibilityOdia?: string;
  feesOdia?: string;
  howToApplyOdia?: string;
  youtubeUrl: string;
  youtubeUrl2: string;
  importantDates: ImportantDateRow[];
  importantLinks: ImportantLinkRow[];
  shareTitle: string;
  shareDescription: string;
  shareTitleOdia?: string;
  shareDescriptionOdia?: string;
  status: "published";
  canonicalStartDate?: string;
  canonicalLastDate?: string;
  canonicalExamDate?: string;
  canonicalResultDate?: string;
  lifecycleStatus?: string;
  dataQualityVersion?: number;
  sourceReferenceStatus?: string;
  sourceReferenceType?: string;
  sourceReferenceLabel?: string;
  sourceReferenceUrl?: string;
  createdAt?: any;
  updatedAt?: any;
};

export const SUGGESTED_SERVICE_DOCUMENTS = [
  "Aadhaar Card",
  "Passport Size Photograph",
  "Mobile Number",
  "Email ID",
  "Residence Certificate",
  "Income Certificate",
  "Caste Certificate",
  "Bank Passbook",
  "Signature",
];

export function createCitizenServiceId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function makeCitizenServiceSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

export function createOverviewRow(
  label = "",
  value = ""
): ServiceOverviewRow {
  return {
    id: createCitizenServiceId("overview"),
    label,
    value,
    labelOdia: "",
    valueOdia: "",
  };
}

export function createServiceDocument(name = ""): ServiceDocumentRow {
  return {
    id: createCitizenServiceId("document"),
    name,
    nameOdia: "",
  };
}

export function normalizeOverviewRows(value: unknown): ServiceOverviewRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any, index) => ({
      id: String(item?.id || `overview_${index}`),
      label: String(item?.label || item?.key || "").trim(),
      value: String(item?.value || item?.details || "").trim(),
      labelOdia: String(item?.labelOdia || item?.odiaLabel || "").trim(),
      valueOdia: String(item?.valueOdia || item?.odiaValue || "").trim(),
    }))
    .filter((item) => item.label || item.value);
}

export function normalizeServiceDocuments(
  value: unknown
): ServiceDocumentRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item: any, index) => ({
      id: String(item?.id || `document_${index}`),
      name:
        typeof item === "string"
          ? item.trim()
          : String(item?.name || item?.label || "").trim(),
      nameOdia:
        typeof item === "string"
          ? ""
          : String(item?.nameOdia || item?.odiaName || "").trim(),
    }))
    .filter((item) => item.name);
}

export function getYouTubeId(url?: string) {
  const cleanUrl = String(url || "").trim();
  const patterns = [
    /youtu\.be\/([^?&/]+)/,
    /youtube\.com\/watch\?v=([^?&/]+)/,
    /youtube\.com\/embed\/([^?&/]+)/,
    /youtube\.com\/shorts\/([^?&/]+)/,
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match?.[1]) return match[1];
  }
  return "";
}

export function getYouTubeThumbnail(url?: string) {
  const id = getYouTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
}
