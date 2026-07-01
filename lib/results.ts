import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { ResultPost } from "@/types/result";

const COLLECTION_NAME = "results";

export function createResultSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function getAllResults(): Promise<ResultPost[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<ResultPost, "id">),
  }));
}

export async function getResultBySlug(slug: string): Promise<ResultPost | null> {
  const allResults = await getAllResults();
  return allResults.find((item) => item.slug === slug) || null;
}

export async function addResult(result: ResultPost) {
  const cleanLinks = (result.links || []).filter(
    (link) => link.label.trim() !== "" && link.url.trim() !== ""
  );

  return addDoc(collection(db, COLLECTION_NAME), {
    ...result,
    links: cleanLinks,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateResult(id: string, result: ResultPost) {
  const cleanLinks = (result.links || []).filter(
    (link) => link.label.trim() !== "" && link.url.trim() !== ""
  );

  const ref = doc(db, COLLECTION_NAME, id);

  return updateDoc(ref, {
    ...result,
    links: cleanLinks,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteResult(id: string) {
  const ref = doc(db, COLLECTION_NAME, id);
  return deleteDoc(ref);
}