import ToolCategoryPageClient from "@/components/public/ToolCategoryPageClient";
import { getPublicCollectionRecords } from "@/lib/server/publicCollections";

export const revalidate = 300;

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function ToolCategoryPage({
  params,
}: {
  params: Promise<{ toolCategory: string }>;
}) {
  const { toolCategory } = await params;
  const resolvedCategory = safeDecode(toolCategory || "");
  const initialRecords = await getPublicCollectionRecords("posts");

  return (
    <ToolCategoryPageClient
      toolCategory={resolvedCategory}
      initialRecords={initialRecords}
    />
  );
}
