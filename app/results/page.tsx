import ResultsPageClient from "@/components/public/ResultsPageClient";
import { getPublicCollectionGroups } from "@/lib/server/publicCollections";

export const revalidate = 3600;

export default async function ResultsPage() {
  const groups = await getPublicCollectionGroups(["posts", "results", "result"]);
  return <ResultsPageClient initialGroups={groups} />;
}
