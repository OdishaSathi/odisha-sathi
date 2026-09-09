import AdmitCardsPageClient from "@/components/public/AdmitCardsPageClient";
import { getPublicCollectionGroups } from "@/lib/server/publicCollections";

export const revalidate = 300;

export default async function AdmitCardsPage() {
  const groups = await getPublicCollectionGroups(["posts", "admitCards", "admit-cards", "admitcards"]);
  return <AdmitCardsPageClient initialGroups={groups} />;
}
