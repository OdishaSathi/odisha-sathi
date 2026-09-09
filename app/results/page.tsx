import ResultsPageClient from "@/components/public/ResultsPageClient";
import { getPublicCollectionGroups } from "@/lib/server/publicCollections";

export const revalidate = 300;

export default async function ResultsPage() {
  const groups = await getPublicCollectionGroups(["posts", "results", "result"]);
  return <ResultsPageClient initialGroups={groups} />;
}
