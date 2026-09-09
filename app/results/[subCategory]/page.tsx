import ResultSubCategoryPageClient from "@/components/public/ResultSubCategoryPageClient";
import { getPublicCollectionGroups } from "@/lib/server/publicCollections";

export const revalidate = 300;

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function ResultSubCategoryPage({
  params,
}: {
  params: Promise<{ subCategory: string }>;
}) {
  const { subCategory } = await params;
  const subCategoryName = safeDecode(subCategory || "");
  const groups = await getPublicCollectionGroups(["posts", "results", "result"]);

  return (
    <ResultSubCategoryPageClient
      subCategoryName={subCategoryName}
      initialGroups={groups}
    />
  );
}
