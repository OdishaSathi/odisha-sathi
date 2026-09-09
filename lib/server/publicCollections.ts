import { collection, getDocs } from "firebase/firestore";
import { dbServer } from "@/lib/firebaseServer";

import type { PublicRecord } from "@/lib/publicRecords";

function serialize(value: any): any {
  if (value == null) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === "function" && typeof value?.seconds === "number") {
    return { seconds: value.seconds, nanoseconds: value.nanoseconds || 0 };
  }
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]));
  }
  return value;
}

export async function getPublicCollectionRecords(name: string): Promise<PublicRecord[]> {
  try {
    const snapshot = await getDocs(collection(dbServer, name));
    return snapshot.docs.map((item) => ({ id: item.id, data: serialize(item.data()) }));
  } catch (error) {
    console.warn(`Server preload skipped ${name}`, error);
    return [];
  }
}

export async function getPublicCollectionGroups(names: string[]) {
  const groups = await Promise.all(names.map(async (name) => [name, await getPublicCollectionRecords(name)] as const));
  return Object.fromEntries(groups) as Record<string, PublicRecord[]>;
}
