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
import { AdmitCard } from "@/types/admitCard";

const COLLECTION_NAME = "admitCards";

export function createAdmitCardSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function getAllAdmitCards(): Promise<AdmitCard[]> {
  const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<AdmitCard, "id">),
  }));
}

export async function getAdmitCardBySlug(slug: string): Promise<AdmitCard | null> {
  const allAdmitCards = await getAllAdmitCards();
  return allAdmitCards.find((item) => item.slug === slug) || null;
}

export async function addAdmitCard(admitCard: AdmitCard) {
  const cleanLinks = (admitCard.links || []).filter(
    (link) => link.label.trim() !== "" && link.url.trim() !== ""
  );

  return addDoc(collection(db, COLLECTION_NAME), {
    ...admitCard,
    links: cleanLinks,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateAdmitCard(id: string, admitCard: AdmitCard) {
  const cleanLinks = (admitCard.links || []).filter(
    (link) => link.label.trim() !== "" && link.url.trim() !== ""
  );

  const ref = doc(db, COLLECTION_NAME, id);

  return updateDoc(ref, {
    ...admitCard,
    links: cleanLinks,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteAdmitCard(id: string) {
  const ref = doc(db, COLLECTION_NAME, id);
  return deleteDoc(ref);
}