import type { Metadata } from "next";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { dbServer } from "@/lib/firebaseServer";
import PublicPostDetailsClient from "@/components/public/PublicPostDetailsClient";

type PostPageProps = {
  params: Promise<{
    slug: string;
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
  shareImage?: string;
  shareTitle?: string;
  shareDescription?: string;
  organization?: string;
  department?: string;
  postName?: string;
  jobInfoPanels?: any[];
};

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

  try {
    const slugQuery = query(
      collection(dbServer, "posts"),
      where("slug", "==", pageSlug),
      limit(1)
    );

    const slugSnapshot = await getDocs(slugQuery);

    if (!slugSnapshot.empty) {
      const item = slugSnapshot.docs[0];
      return {
        id: item.id,
        ...item.data(),
      };
    }

    const directDoc = await getDoc(doc(dbServer, "posts", pageSlug));

    if (directDoc.exists()) {
      return {
        id: directDoc.id,
        ...directDoc.data(),
      };
    }

    return null;
  } catch (error) {
    console.error("Metadata post fetch failed:", error);
    return null;
  }
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

function buildOgImageUrl(post: MetaPost | null, slug: string) {
  const customImage =
    post?.previewImageUrl?.trim() ||
    post?.imageUrl?.trim() ||
    post?.shareImage?.trim();

  if (customImage) return customImage;

  const params = new URLSearchParams({
    category: post?.category || "Job",
    title: cleanText(post?.title || "Odisha Sathi Update", 80),
    department: getDepartmentName(post),
    posts: getPostNames(post),
  });

  return `/api/og/post?${params.toString()}`;
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostForMetadata(slug);

  const title = cleanText(
    post?.shareTitle || post?.title || "Odisha Sathi Update",
    90
  );

  const description = getDescription(post);
  const imageUrl = buildOgImageUrl(post, slug);
  const canonicalUrl = `/post/${encodeURIComponent(slug)}`;

  return {
    metadataBase: new URL("https://odishasathi.in"),
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Odisha Sathi",
      type: "article",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function PublicPostDetailsPage() {
  return <PublicPostDetailsClient />;
}