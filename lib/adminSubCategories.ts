import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AdminSubCategoryOption = {
  id: string;
  parentSection: string;
  label: string;
  value: string;
  displayOrder: number;
};

export function makeAdminSubCategorySlug(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || `subcategory-${Date.now()}`;
}

export function mergeSubCategoryOptions<T extends { label: string; value: string }>(
  baseOptions: T[],
  managedOptions: AdminSubCategoryOption[],
  trailingOptions: T[] = []
) {
  const seen = new Set<string>();
  const merged: T[] = [];

  const addOption = (option: T) => {
    const key = `${option.label.trim().toLowerCase()}|${option.value.trim().toLowerCase()}`;
    if (!option.label.trim() || !option.value.trim() || seen.has(key)) return;
    seen.add(key);
    merged.push(option);
  };

  baseOptions.forEach(addOption);
  managedOptions.forEach((item) => {
    addOption({ label: item.label, value: item.value } as T);
  });
  trailingOptions.forEach(addOption);

  return merged;
}

export function mergeSubCategoryNames(
  baseNames: string[],
  managedOptions: AdminSubCategoryOption[]
) {
  const seen = new Set<string>();
  const merged: string[] = [];

  const addName = (name: string) => {
    const cleanName = String(name || "").trim();
    const key = cleanName.toLowerCase();
    if (!cleanName || seen.has(key)) return;
    seen.add(key);
    merged.push(cleanName);
  };

  baseNames.forEach(addName);
  managedOptions.forEach((item) => addName(item.label));

  return merged;
}

export async function getActiveAdminSubCategories(
  parentSection: string
): Promise<AdminSubCategoryOption[]> {
  const snapshot = await getDocs(collection(db, "subCategories"));

  return snapshot.docs
    .map((docItem) => {
      const data = docItem.data();
      const name = String(data.name || "").trim();
      const slug = String(data.slug || "").trim() || makeAdminSubCategorySlug(name);

      return {
        id: docItem.id,
        parentSection: String(data.parentSection || "").trim(),
        label: name,
        value: slug,
        displayOrder: Number(data.displayOrder || 999),
        status: data.status === "hidden" ? "hidden" : "active",
      };
    })
    .filter(
      (item) =>
        item.parentSection === parentSection &&
        item.status !== "hidden" &&
        item.label &&
        item.value
    )
    .sort((a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label));
}
