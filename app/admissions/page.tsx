import AdmissionsPageClient from "@/components/public/AdmissionsPageClient";
import { getPublicCollectionGroups } from "@/lib/server/publicCollections";

export const revalidate = 300;

export default async function AdmissionsPage() {
  const groups = await getPublicCollectionGroups(["posts", "schemes", "scheme"]);
  return <AdmissionsPageClient initialGroups={groups} />;
}
