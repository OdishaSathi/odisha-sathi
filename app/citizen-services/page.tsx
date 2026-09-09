import CitizenServicesPageClient from "@/components/public/CitizenServicesPageClient";
import { getPublicCollectionGroups } from "@/lib/server/publicCollections";

export const revalidate = 300;

export default async function CitizenServicesPage() {
  const groups = await getPublicCollectionGroups(["posts", "subCategories"]);
  return <CitizenServicesPageClient initialGroups={groups} />;
}
