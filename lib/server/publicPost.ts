import { cache } from "react";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { dbServer } from "@/lib/firebaseServer";
import { isPublicDetailPost } from "@/lib/publicPostQuality";

export type ServerPublicPostRecord = {
  id: string;
  data: Record<string, any>;
  sourceCollection: string;
  categoryOverride: string;
  matchedBy: "slug" | "id";
  canonicalSlug: string;
};

const PUBLIC_POST_COLLECTIONS = [
  { name: "posts", category: "" },
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
] as const;

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function serialize(value: any): any {
  if (value == null) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === "function" && typeof value?.seconds === "number") {
    return { seconds: value.seconds, nanoseconds: value.nanoseconds || 0 };
  }
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
  }
  return value;
}

function buildRecord(
  id: string,
  data: Record<string, any>,
  sourceCollection: string,
  categoryOverride: string,
  matchedBy: "slug" | "id"
): ServerPublicPostRecord {
  return {
    id,
    data: serialize(data),
    sourceCollection,
    categoryOverride,
    matchedBy,
    canonicalSlug: String(data.slug || id).trim() || id,
  };
}

export const getServerPublicPost = cache(async (slugOrId: string): Promise<ServerPublicPostRecord | null> => {
  const pageValue = safeDecode(String(slugOrId || "").trim());
  if (!pageValue) return null;

  for (const item of PUBLIC_POST_COLLECTIONS) {
    try {
      const slugQuery = query(
        collection(dbServer, item.name),
        where("slug", "==", pageValue),
        limit(1)
      );
      const slugSnapshot = await getDocs(slugQuery);

      if (!slugSnapshot.empty) {
        const postDoc = slugSnapshot.docs[0];
        const data = postDoc.data();
        const qualityData = {
          ...data,
          category: data.category || item.category,
        };

        if (isPublicDetailPost(qualityData, postDoc.id)) {
          return buildRecord(postDoc.id, data, item.name, item.category, "slug");
        }
      }

      const directDoc = await getDoc(doc(dbServer, item.name, pageValue));
      if (!directDoc.exists()) continue;

      const data = directDoc.data();
      const qualityData = {
        ...data,
        category: data.category || item.category,
      };

      if (!isPublicDetailPost(qualityData, directDoc.id)) continue;

      return buildRecord(directDoc.id, data, item.name, item.category, "id");
    } catch (error) {
      console.warn(`Public post lookup skipped ${item.name}`, error);
    }
  }

  return null;
});
