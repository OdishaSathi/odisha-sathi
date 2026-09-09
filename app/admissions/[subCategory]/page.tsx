import AdmissionSubCategoryPageClient from "@/components/public/AdmissionSubCategoryPageClient";
import { getPublicCollectionGroups } from "@/lib/server/publicCollections";

export const revalidate = 300;

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function AdmissionSubCategoryPage({
  params,
}: {
  params: Promise<{ subCategory: string }>;
}) {
  const { subCategory } = await params;
  const subCategoryName = safeDecode(subCategory || "");
  const groups = await getPublicCollectionGroups([
    "posts",
    "admissions",
    "admission",
    "schemes",
    "scheme",
  ]);

  return (
    <AdmissionSubCategoryPageClient
      subCategoryName={subCategoryName}
      initialGroups={groups}
    />
  );
}
