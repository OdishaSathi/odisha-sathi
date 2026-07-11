import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDefaultCategoryPreviewImage } from "@/lib/defaultImages";

export type ImportantInfoRow = {
  label: string;
  value: string;
};

export type ImportantInfoSection = {
  title: string;
  content: string;
};

export type ImportantInfoPost = {
  id?: string;
  title: string;
  slug: string;
  shortDescription?: string;
  details?: string;
  detailSections?: ImportantInfoSection[];
  imageUrls?: string[];
  youtubeUrl?: string;
  youtubeUrls?: string[];
  referenceKeywords?: string[];
  quickInfoRows?: ImportantInfoRow[];
  shareTitle?: string;
  shareDescription?: string;
  shareImageUrl?: string;
  isFeatured?: boolean;
  featuredOrder?: number;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
};

export const IMPORTANT_INFORMATION_COLLECTION = "importantInformation";

export function getImportantInfoYouTubeId(url?: string) {
  const cleanUrl = String(url || "").trim();

  if (!cleanUrl) return "";

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

  try {
    const parsedUrl = new URL(cleanUrl);
    return parsedUrl.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

export function getImportantInfoYouTubeThumbnail(url?: string) {
  const videoId = getImportantInfoYouTubeId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "";
}

export function getFirstImportantInfoYouTubeThumbnail(post?: Partial<ImportantInfoPost> | null) {
  const videoLinks = [post?.youtubeUrl, ...(post?.youtubeUrls || [])];

  for (const videoLink of videoLinks) {
    const thumbnailUrl = getImportantInfoYouTubeThumbnail(videoLink);
    if (thumbnailUrl) return thumbnailUrl;
  }

  return "";
}

export function getImportantInfoDisplayImage(post?: Partial<ImportantInfoPost> | null) {
  const customImage =
    post?.shareImageUrl?.trim() ||
    post?.imageUrls?.find((item) => String(item || "").trim()) ||
    "";

  if (customImage) return customImage;

  const youtubeThumbnail = getFirstImportantInfoYouTubeThumbnail(post);

  if (youtubeThumbnail) return youtubeThumbnail;

  return getDefaultCategoryPreviewImage(
    "important-information",
    post?.title || post?.shortDescription || "Important Information"
  );
}

export function getImportantInfoOgImage(
  post?: Partial<ImportantInfoPost> | null,
  siteUrl = "https://odishasathi.in"
) {
  const customImage =
    post?.shareImageUrl?.trim() ||
    post?.imageUrls?.find((item) => String(item || "").trim()) ||
    "";

  if (customImage) return customImage;

  const youtubeThumbnail = getFirstImportantInfoYouTubeThumbnail(post);

  if (youtubeThumbnail) return youtubeThumbnail;

  const imageUrl = new URL("/api/og/post", siteUrl);
  imageUrl.searchParams.set("category", "Important Information");
  imageUrl.searchParams.set("department", "Odisha Sathi");
  imageUrl.searchParams.set(
    "posts",
    post?.title || post?.shortDescription || "Important Information"
  );

  return imageUrl.toString();
}

export function makeImportantInfoSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function normalizeStringList(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function cleanImportantInfoPost(data: any, id?: string): ImportantInfoPost {
  const imageUrls = Array.isArray(data.imageUrls)
    ? data.imageUrls.map((item: any) => String(item || "").trim()).filter(Boolean)
    : normalizeStringList(data.imageUrls);

  const youtubeUrls = Array.isArray(data.youtubeUrls)
    ? data.youtubeUrls.map((item: any) => String(item || "").trim()).filter(Boolean)
    : normalizeStringList(data.youtubeUrls);

  const referenceKeywords = Array.isArray(data.referenceKeywords)
    ? data.referenceKeywords.map((item: any) => String(item || "").trim()).filter(Boolean)
    : normalizeStringList(data.referenceKeywords);

  const quickInfoRows = Array.isArray(data.quickInfoRows)
    ? data.quickInfoRows
        .map((item: any) => ({
          label: String(item?.label || "").trim(),
          value: String(item?.value || "").trim(),
        }))
        .filter((item: ImportantInfoRow) => item.label || item.value)
    : [];

  const detailSections = Array.isArray(data.detailSections)
    ? data.detailSections
        .map((item: any) => ({
          title: String(item?.title || "").trim(),
          content: String(item?.content || "").trim(),
        }))
        .filter((item: ImportantInfoSection) => item.title || item.content)
    : [];

  return {
    id,
    title: String(data.title || "").trim(),
    slug: String(data.slug || "").trim(),
    shortDescription: String(data.shortDescription || "").trim(),
    details: String(data.details || data.description || "").trim(),
    detailSections,
    imageUrls,
    youtubeUrl: String(data.youtubeUrl || "").trim(),
    youtubeUrls,
    referenceKeywords,
    quickInfoRows,
    shareTitle: String(data.shareTitle || "").trim(),
    shareDescription: String(data.shareDescription || "").trim(),
    shareImageUrl: String(data.shareImageUrl || "").trim(),
    isFeatured: Boolean(data.isFeatured),
    featuredOrder: Number(data.featuredOrder || 0),
    status: String(data.status || "published").trim() || "published",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

export async function getImportantInformationPosts() {
  const snapshot = await getDocs(collection(db, IMPORTANT_INFORMATION_COLLECTION));

  return snapshot.docs
    .map((docItem) => cleanImportantInfoPost(docItem.data(), docItem.id))
    .sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
}

export async function getImportantInformationPost(id: string) {
  const docSnapshot = await getDoc(doc(db, IMPORTANT_INFORMATION_COLLECTION, id));

  if (!docSnapshot.exists()) return null;

  return cleanImportantInfoPost(docSnapshot.data(), docSnapshot.id);
}

export async function createImportantInformationPost(data: ImportantInfoPost) {
  return addDoc(collection(db, IMPORTANT_INFORMATION_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateImportantInformationPost(id: string, data: ImportantInfoPost) {
  return updateDoc(doc(db, IMPORTANT_INFORMATION_COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteImportantInformationPost(id: string) {
  return deleteDoc(doc(db, IMPORTANT_INFORMATION_COLLECTION, id));
}

export async function isImportantInfoSlugAvailable(slug: string, currentId?: string) {
  const slugQuery = query(
    collection(db, IMPORTANT_INFORMATION_COLLECTION),
    where("slug", "==", slug)
  );
  const snapshot = await getDocs(slugQuery);

  return snapshot.docs.every((docItem) => docItem.id === currentId);
}
