import SchemesPageClient from "@/components/public/SchemesPageClient";
import { getPublicCollectionGroups } from "@/lib/server/publicCollections";

export const revalidate = 3600;

export default async function SchemesPage() {
  const groups = await getPublicCollectionGroups(["posts", "schemes", "scheme", "governmentSchemes", "government-schemes"]);
  return <SchemesPageClient initialGroups={groups} />;
}
