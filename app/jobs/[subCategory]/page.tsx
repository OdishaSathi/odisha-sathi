import JobSubCategoryPageClient from "@/components/public/JobSubCategoryPageClient";
import { getPublicCollectionGroups } from "@/lib/server/publicCollections";

export const revalidate = 300;

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function JobSubCategoryPage({
  params,
}: {
  params: Promise<{ subCategory: string }>;
}) {
  const { subCategory } = await params;
  const subCategoryName = safeDecode(subCategory || "");
  const groups = await getPublicCollectionGroups(["posts"]);

  return (
    <JobSubCategoryPageClient
      subCategoryName={subCategoryName}
      initialRecords={groups.posts || []}
    />
  );
}
