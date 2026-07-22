import type { Metadata } from "next";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { dbServer } from "@/lib/firebaseServer";
import PublicPostDetailsClient from "@/components/public/PublicPostDetailsClient";
import { decorateShareMetadata } from "@/lib/postShare";
import {
  buildJobShareSummary,
  getJobShareThumbnail,
  isJobPostData,
} from "@/lib/jobShare";
import { isPublicDetailPost } from "@/lib/publicPostQuality";

type PostPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    reminder?: string | string[];
  }>;
};

type MetaPost = {
  id: string;
  title?: string;
  slug?: string;
  category?: string;
  subCategory?: string;
  subCategories?: string[];
  shortDescription?: string;
  excerpt?: string;
  description?: string;
  content?: string;
  previewImageUrl?: string;
  imageUrl?: string;
  bannerImageUrl?: string;
  bannerUrl?: string;
  imageUrls?: string[];
  shareImage?: string;
  shareTitle?: string;
  shareDescription?: string;
  organization?: string;
  department?: string;
  postName?: string;
  jobInfoPanels?: any[];
};

const PUBLIC_POST_COLLECTIONS = [
  { name: "posts", category: "" },
  { name: "jobs", category: "jobs" },
  { name: "admissions", category: "admissions" },
  { name: "admitCards", category: "admit-cards" },
  { name: "admit-cards", category: "admit-cards" },
  { name: "admitcards", category: "admit-cards" },
  { name: "results", category: "results" },
  { name: "result", category: "results" },
  { name: "schemes", category: "schemes" },
  { name: "scheme", category: "schemes" },
  { name: "governmentSchemes", category: "schemes" },
  { name: "government-schemes", category: "schemes" },
];

function cleanText(value: any, maxLength = 160) {
  const text = String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

async function getPostForMetadata(slug: string): Promise<MetaPost | null> {
  const pageSlug = decodeURIComponent(slug);

  for (const item of PUBLIC_POST_COLLECTIONS) {
    try {
      const slugQuery = query(
        collection(dbServer, item.name),
        where("slug", "==", pageSlug),
        limit(1)
      );

      const slugSnapshot = await getDocs(slugQuery);

      if (!slugSnapshot.empty) {
        const postDoc = slugSnapshot.docs[0];
        const data = postDoc.data();
        const postData = {
          ...data,
          category: item.category || data.category,
        };

        if (!isPublicDetailPost(postData, postDoc.id)) continue;

        return {
          id: postDoc.id,
          ...postData,
        };
      }

      const directDoc = await getDoc(doc(dbServer, item.name, pageSlug));

      if (directDoc.exists()) {
        const data = directDoc.data();
        const postData = {
          ...data,
          category: item.category || data.category,
        };

        if (!isPublicDetailPost(postData, directDoc.id)) continue;

        return {
          id: directDoc.id,
          ...postData,
        };
      }
    } catch (error) {
      console.warn(`Metadata fetch skipped ${item.name}`, error);
    }
  }

  return null;
}

function getDepartmentName(post: MetaPost | null) {
  if (!post) return "Odisha Sathi";

  const firstPanel = Array.isArray(post.jobInfoPanels)
    ? post.jobInfoPanels[0]
    : null;

  return cleanText(
    firstPanel?.organization ||
      post.organization ||
      post.department ||
      "Odisha Sathi",
    70
  );
}

function getPostNames(post: MetaPost | null) {
  if (!post) return "Latest Update";

  if (Array.isArray(post.jobInfoPanels) && post.jobInfoPanels.length > 0) {
    const names = post.jobInfoPanels
      .map((item) => item?.postName)
      .filter(Boolean)
      .join(", ");

    if (names.trim()) return cleanText(names, 90);
  }

  return cleanText(post.postName || post.title || "Latest Update", 90);
}

function getDescription(post: MetaPost | null) {
  if (!post) {
    return "Latest jobs, admissions, admit cards, results and government scheme updates from Odisha Sathi.";
  }

  return (
    cleanText(
      post.shareDescription ||
        post.shortDescription ||
        post.excerpt ||
        post.description ||
        post.content,
      160
    ) ||
    "Latest jobs, admissions, admit cards, results and government scheme updates from Odisha Sathi."
  );
}

function buildOgImageUrl(post: MetaPost | null) {
  const shareThumbnail = getJobShareThumbnail(post);

  const params = new URLSearchParams({
    category: post?.category || "Job",
    title: cleanText(post?.title || "Odisha Sathi Update", 80),
    department: getDepartmentName(post),
    posts: getPostNames(post),
  });

  const fallbackUrl = `/api/og/post?${params.toString()}`;

  if (!shareThumbnail) return fallbackUrl;

  const thumbnailParams = new URLSearchParams({
    src: shareThumbnail,
    fallback: fallbackUrl,
  });

  return `/api/og/thumbnail?${thumbnailParams.toString()}`;
}

export async function generateMetadata({
  params,
  searchParams,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isReminderShare = resolvedSearchParams.reminder === "1";
  const post = await getPostForMetadata(slug);
  const canonicalUrl = `/post/${encodeURIComponent(slug)}`;

  if (!post) {
    return {
      title: "Post unavailable",
      description:
        "This Odisha Sathi post is unavailable or is being reviewed before publication.",
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const isJobPost = isJobPostData(post);
  const jobShareSummary = isJobPost ? buildJobShareSummary(post) : null;

  const pageTitle = cleanText(
    post?.shareTitle || post?.title || "Odisha Sathi Update",
    90
  );

  const normalShareTitle = jobShareSummary?.title || pageTitle;
  const normalDescription =
    jobShareSummary?.metadataDescription || getDescription(post);
  const decoratedMetadata = decorateShareMetadata(
    normalShareTitle,
    normalDescription
  );
  const shareTitle = isReminderShare
    ? "Odisha Sathi Last Date Reminder"
    : decoratedMetadata.title;
  const description = isReminderShare
    ? `${normalShareTitle} • ${post?.category || "Latest Update"}`
    : decoratedMetadata.description;
  const imageUrl = buildOgImageUrl(post);

  return {
    metadataBase: new URL("https://odishasathi.in"),
    title: pageTitle,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: shareTitle,
      description,
      url: canonicalUrl,
      siteName: "Odisha Sathi",
      type: "article",
      images: isReminderShare
        ? []
        : [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: shareTitle,
            },
          ],
    },
    twitter: {
      card: isReminderShare ? "summary" : "summary_large_image",
      title: shareTitle,
      description,
      images: isReminderShare ? [] : [imageUrl],
    },
  };
}

export default function PublicPostDetailsPage() {
  return <PublicPostDetailsClient />;
}
