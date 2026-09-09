import CitizenServiceCategoryPageClient from "@/components/public/CitizenServiceCategoryPageClient";
import { getPublicCollectionGroups } from "@/lib/server/publicCollections";

export const revalidate = 300;

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function CitizenServiceCategoryPage({
  params,
}: {
  params: Promise<{ subCategory: string }>;
}) {
  const { subCategory } = await params;
  const selected = safeDecode(subCategory || "");
  const groups = await getPublicCollectionGroups(["posts", "subCategories"]);

  return (
    <CitizenServiceCategoryPageClient
      selected={selected}
      initialGroups={groups}
    />
  );
}
