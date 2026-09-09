import { cache } from "react";
import { doc, getDoc } from "firebase/firestore";
import { dbServer } from "@/lib/firebaseServer";
import {
  fallbackPublicSiteSettings,
  normalizePublicSiteSettings,
  type PublicSiteSettings,
} from "@/lib/publicSiteSettings";

export const getServerPublicSiteSettings = cache(async (): Promise<PublicSiteSettings> => {
  try {
    const snapshot = await getDoc(doc(dbServer, "siteSettings", "main"));
    return normalizePublicSiteSettings(snapshot.exists() ? snapshot.data() : null);
  } catch (error) {
    console.warn("Server site settings unavailable; using safe defaults", error);
    return fallbackPublicSiteSettings;
  }
});
