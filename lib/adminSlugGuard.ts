import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const ACTIVE_PUBLIC_POST_COLLECTIONS = ["posts", "results", "admitCards"] as const;

export type PublicSlugConflict = {
  collectionName: (typeof ACTIVE_PUBLIC_POST_COLLECTIONS)[number];
  documentId: string;
  title: string;
  slug: string;
  category: string;
};

function normalizeSlug(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/**
 * Checks the active collections that can resolve through /post/[slug].
 * A duplicate slug across any of these collections is unsafe because the
 * public route would otherwise have more than one possible destination.
 */
export async function findPublicSlugConflict(
  slug: string,
  current?: { collectionName: string; documentId: string }
): Promise<PublicSlugConflict | null> {
  const cleanSlug = normalizeSlug(slug);
  if (!cleanSlug) return null;

  const matches = await Promise.all(
    ACTIVE_PUBLIC_POST_COLLECTIONS.map(async (collectionName) => {
      const slugQuery = query(
        collection(db, collectionName),
        where("slug", "==", cleanSlug),
        limit(5)
      );
      const snapshot = await getDocs(slugQuery);

      return snapshot.docs
        .filter(
          (item) =>
            !(
              current?.collectionName === collectionName &&
              current?.documentId === item.id
            )
        )
        .map((item) => {
          const data = item.data();
          return {
            collectionName,
            documentId: item.id,
            title: String(
              data.title || data.schemeName || data.examName || "Untitled post"
            ).trim(),
            slug: String(data.slug || cleanSlug).trim(),
            category: String(data.category || collectionName).trim(),
          } satisfies PublicSlugConflict;
        });
    })
  );

  return matches.flat()[0] || null;
}

export function formatPublicSlugConflict(conflict: PublicSlugConflict) {
  return `This URL slug is already used by \"${conflict.title}\" (${conflict.category}). Please use a different slug.`;
}
