import ToolsPageClient from "@/components/public/ToolsPageClient";
import { getPublicCollectionGroups } from "@/lib/server/publicCollections";

export const revalidate = 300;

const LATEST_COLLECTIONS = [
  "posts",
  "jobs",
  "admissions",
  "admitCards",
  "admit-cards",
  "admitcards",
  "results",
  "result",
  "schemes",
  "scheme",
];

export default async function ToolsPage() {
  const initialGroups = await getPublicCollectionGroups(LATEST_COLLECTIONS);
  return <ToolsPageClient initialGroups={initialGroups} />;
}
