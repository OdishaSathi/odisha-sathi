import JobsPageClient from "@/components/public/JobsPageClient";
import { getPublicCollectionGroups } from "@/lib/server/publicCollections";

export const revalidate = 300;

export default async function JobsPage() {
  const groups = await getPublicCollectionGroups(["posts"]);
  return <JobsPageClient initialRecords={groups.posts || []} />;
}
