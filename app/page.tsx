import HomePageClient from "@/components/public/HomePageClient";
import { getPublicCollectionGroups } from "@/lib/server/publicCollections";

export const revalidate = 300;

const HOME_COLLECTIONS = ["posts","jobs","admissions","admitCards","admit-cards","admitcards","results","result","schemes","scheme","governmentSchemes","government-schemes","importantInformation"];

export default async function HomePage() {
  const groups = await getPublicCollectionGroups(HOME_COLLECTIONS);
  return <HomePageClient initialGroups={groups} />;
}
