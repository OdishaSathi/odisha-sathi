import type { Metadata } from "next";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { dbServer } from "@/lib/firebaseServer";

type SectionCategory = "results" | "admissions" | "admit-cards" | "schemes";

type SectionMetaInput = {
  category: SectionCategory;
  slugOrId: string;
  routeBase: string;
};

const SITE_URL = "https://odishasathi.in";

function cleanText(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

function truncateText(value: string, maxLength = 155) {
  const cleanValue = value.replace(/\s+/g, " ").trim();

  if (cleanValue.length <= maxLength) {
    return cleanValue;
  }

  return `${cleanValue.slice(0, maxLength - 3)}...`;
}

function getCategoryLabel(category: SectionCategory) {
  if (category === "results") return "Result Update";
  if (category === "admissions") return "Admission Update";
  if (category === "admit-cards") return "Admit Card Update";
  return "Scheme Update";
}

function getDepartmentByCategory(category: SectionCategory, data: any) {
  if (category === "results") {
    return cleanText(data.organization, "Odisha Sathi");
  }

  if (category === "admit-cards") {
    return cleanText(data.organization, "Odisha Sathi");
  }

  if (category === "admissions") {
    return cleanText(data.department, "Odisha Sathi");
  }

  return cleanText(data.department, "Odisha Sathi");
}

function getMainTitleByCategory(category: SectionCategory, data: any) {
  if (category === "results") {
    return cleanText(data.examName || data.title, getCategoryLabel(category));
  }

  if (category === "admit-cards") {
    return cleanText(data.examName || data.title, getCategoryLabel(category));
  }

  if (category === "admissions") {
    return cleanText(
      data.admissionCategory || data.title,
      getCategoryLabel(category)
    );
  }

  return cleanText(data.schemeName || data.title, getCategoryLabel(category));
}

function getPageTitleByCategory(category: SectionCategory, data: any) {
  const title = cleanText(
    data.title || data.schemeName || data.examName || data.admissionCategory,
    getCategoryLabel(category)
  );

  return `${title} - Odisha Sathi`;
}

function getDescriptionByCategory(category: SectionCategory, data: any) {
  const fallback = `Get latest ${getCategoryLabel(
    category
  ).toLowerCase()} details, important dates, links and updates on Odisha Sathi.`;

  return truncateText(
    cleanText(
      data.shareDescription ||
        data.shortDescription ||
        data.description ||
        data.content,
      fallback
    )
  );
}

function getCustomImage(data: any) {
  return cleanText(
    data.previewImageUrl ||
      data.shareImageUrl ||
      data.shareImage ||
      data.sharingImageUrl ||
      data.imageUrl ||
      data.thumbnailUrl ||
      data.bannerImageUrl
  );
}

function getDefaultOgImage(category: SectionCategory, data: any) {
  const imageUrl = new URL("/api/og/post", SITE_URL);

  imageUrl.searchParams.set("title", getMainTitleByCategory(category, data));
  imageUrl.searchParams.set("department", getDepartmentByCategory(category, data));
  imageUrl.searchParams.set("category", getCategoryLabel(category));

  return imageUrl.toString();
}

async function getPostBySlugOrId(category: SectionCategory, slugOrId: string) {
  const cleanSlugOrId = decodeURIComponent(slugOrId || "").trim();

  if (!cleanSlugOrId) return null;

  try {
    const directSnap = await getDoc(doc(dbServer, "posts", cleanSlugOrId));

    if (directSnap.exists()) {
      const data = directSnap.data();

      if (
        data.category === category &&
        data.published !== false &&
        !["draft", "archived", "hidden", "private"].includes(
          String(data.status || "published").toLowerCase()
        )
      ) {
        return {
          id: directSnap.id,
          ...data,
        };
      }
    }
  } catch {
    // Continue with slug search
  }

  const q = query(collection(dbServer, "posts"), where("category", "==", category));
  const snapshot = await getDocs(q);

  const matchedDoc = snapshot.docs.find((docItem) => {
    const data = docItem.data();

    return (
      data.published !== false &&
      !["draft", "archived", "hidden", "private"].includes(
        String(data.status || "published").toLowerCase()
      ) &&
      (data.slug === cleanSlugOrId || docItem.id === cleanSlugOrId)
    );
  });

  if (!matchedDoc) return null;

  return {
    id: matchedDoc.id,
    ...matchedDoc.data(),
  };
}

export async function generateSectionPostMetadata({
  category,
  slugOrId,
  routeBase,
}: SectionMetaInput): Promise<Metadata> {
  const data = await getPostBySlugOrId(category, slugOrId);

  if (!data) {
    const fallbackTitle = `${getCategoryLabel(category)} - Odisha Sathi`;
    const fallbackDescription = `Latest ${getCategoryLabel(
      category
    ).toLowerCase()} updates on Odisha Sathi.`;

    return {
      title: fallbackTitle,
      description: fallbackDescription,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDescription,
        url: `${SITE_URL}${routeBase}/${slugOrId}`,
        siteName: "Odisha Sathi",
        images: [
          {
            url: `${SITE_URL}/api/og/post?title=${encodeURIComponent(
              getCategoryLabel(category)
            )}&department=${encodeURIComponent("Odisha Sathi")}`,
            width: 1200,
            height: 630,
            alt: fallbackTitle,
          },
        ],
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: fallbackTitle,
        description: fallbackDescription,
        images: [
          `${SITE_URL}/api/og/post?title=${encodeURIComponent(
            getCategoryLabel(category)
          )}&department=${encodeURIComponent("Odisha Sathi")}`,
        ],
      },
    };
  }

    const postData = data as any;

  const title = getPageTitleByCategory(category, postData);
  const description = getDescriptionByCategory(category, postData);
  const customImage = getCustomImage(postData);
  const imageUrl = customImage || getDefaultOgImage(category, postData);
  const pageUrl = `${SITE_URL}${routeBase}/${
    postData.slug || postData.id || slugOrId
  }`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Odisha Sathi",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
