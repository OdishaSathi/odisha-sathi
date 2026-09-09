import SchemeCategoryPageClient from "@/components/public/SchemeCategoryPageClient";
import { getPublicCollectionGroups } from "@/lib/server/publicCollections";

export const revalidate = 300;

const SCHEME_COLLECTIONS = [
  "posts",
  "schemes",
  "scheme",
  "governmentSchemes",
  "government-schemes",
];

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function SchemeCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categoryName = safeDecode(id || "");
  const initialGroups = await getPublicCollectionGroups(SCHEME_COLLECTIONS);

  return (
    <SchemeCategoryPageClient
      key={categoryName}
      categoryName={categoryName}
      initialGroups={initialGroups}
    />
  );
}
