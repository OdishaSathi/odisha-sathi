import type { MetadataRoute } from "next";
import { collection, getDocs } from "firebase/firestore";
import { dbServer } from "@/lib/firebaseServer";
import { siteConfig } from "@/lib/siteConfig";

const STATIC_ROUTES = [
  "/",
  "/jobs",
  "/results",
  "/admissions",
  "/admit-cards",
  "/schemes",
  "/tools",
  "/about",
  "/contact",
  "/privacy-policy",
  "/disclaimer",
  "/terms-and-conditions",
  "/correction-request",
  "/sitemap",
];

function getBaseUrl() {
  return siteConfig.siteUrl.replace(/\/$/, "");
}

function normalizeText(value?: any) {
  return String(value || "").trim().toLowerCase();
}

function getTimeValue(value?: any) {
  if (value && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }

  return new Date();
}

function getPostRoute(data: any, id: string) {
  const slug = data.slug || id;
  const encodedSlug = encodeURIComponent(slug);
  const category = normalizeText(data.category);

  if (category === "results") return `/results/${encodedSlug}`;
  if (category === "admissions") return `/admissions/${encodedSlug}`;
  if (category === "admit-cards") return `/admit-cards/${encodedSlug}`;
  if (category === "schemes") return `/schemes/${encodedSlug}`;
  if (category === "tools") return null;

  return `/post/${encodedSlug}`;
}

function dedupeRoutes(routes: MetadataRoute.Sitemap) {
  const seen = new Set<string>();

  return routes.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

async function getPublicPostRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const snapshot = await getDocs(collection(dbServer, "posts"));
    const baseUrl = getBaseUrl();

    return snapshot.docs
      .map((docItem) => {
        const data = docItem.data();

        if (data.published === false || data.status === "hidden") return null;

        const route = getPostRoute(data, docItem.id);
        if (!route) return null;

        return {
          url: `${baseUrl}${route}`,
          lastModified: getTimeValue(data.updatedAt || data.createdAt),
          changeFrequency: "weekly" as const,
          priority: 0.75,
        };
      })
      .filter(Boolean) as MetadataRoute.Sitemap;
  } catch (error) {
    console.error("Sitemap public posts fetch failed:", error);
    return [];
  }
}

async function getImportantInformationRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const snapshot = await getDocs(collection(dbServer, "importantInformation"));
    const baseUrl = getBaseUrl();

    return snapshot.docs
      .map((docItem) => {
        const data = docItem.data();

        if (data.status === "hidden" || data.published === false) return null;

        const slug = data.slug || docItem.id;

        return {
          url: `${baseUrl}/important-information/${encodeURIComponent(slug)}`,
          lastModified: getTimeValue(data.updatedAt || data.createdAt),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        };
      })
      .filter(Boolean) as MetadataRoute.Sitemap;
  } catch (error) {
    console.error("Sitemap important information fetch failed:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const baseUrl = getBaseUrl();
  const staticRoutes: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "daily" : "weekly",
    priority: route === "/" ? 1 : route === "/sitemap" ? 0.5 : 0.7,
  }));

  const [postRoutes, importantInfoRoutes] = await Promise.all([
    getPublicPostRoutes(),
    getImportantInformationRoutes(),
  ]);

  return dedupeRoutes([...staticRoutes, ...importantInfoRoutes, ...postRoutes]);
}
