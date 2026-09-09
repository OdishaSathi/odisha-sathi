import AdmitCardSubCategoryPageClient from "@/components/public/AdmitCardSubCategoryPageClient";
import { getPublicCollectionGroups } from "@/lib/server/publicCollections";

export const revalidate = 300;

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function AdmitCardSubCategoryPage({
  params,
}: {
  params: Promise<{ subCategory: string }>;
}) {
  const { subCategory } = await params;
  const subCategoryName = safeDecode(subCategory || "");
  const groups = await getPublicCollectionGroups([
    "posts",
    "admitCards",
    "admit-cards",
    "admitcards",
  ]);

  return (
    <AdmitCardSubCategoryPageClient
      subCategoryName={subCategoryName}
      initialGroups={groups}
    />
  );
}
