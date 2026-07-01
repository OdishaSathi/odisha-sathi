"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import PostDetailLayout, {
  CommonPostDetailData,
  ImportantDateRow,
  ImportantLinkRow,
  InfoRow,
  InfoSection,
} from "@/components/public/PostDetailLayout";

type JobInfoPanel = {
  id?: string;
  organization?: string;
  postName?: string;
  totalVacancy?: string;
  qualification?: string;
  ageLimit?: string;
  salary?: string;
};

type QuickInfoRow = {
  id?: string;
  type?: string;
  label?: string;
  value?: string;
};

type PostData = {
  id: string;
  title: string;
  slug?: string;

  category?: string;
  subCategory?: string;
  subCategories?: string[];

  excerpt?: string;
  content?: string;

  shortDescription?: string;
  description?: string;

  imageUrl?: string;
  previewImageUrl?: string;
  shareImage?: string;

  youtubeUrl?: string;

  shareTitle?: string;
  shareDescription?: string;

  jobInfoPanels?: JobInfoPanel[];
  quickInfoRows?: QuickInfoRow[];

  importantDates?: ImportantDateRow[];
  importantLinks?: ImportantLinkRow[];

  sourceUrl?: string;

  organization?: string;
  department?: string;
  postName?: string;
  totalVacancy?: string;
  qualification?: string;
  ageLimit?: string;
  salary?: string;
  payScale?: string;

  status?: string;
  createdAt?: any;
  updatedAt?: any;
};

function getBackLink(category?: string) {
  if (category === "jobs") return "/jobs";
  if (category === "results") return "/results";
  if (category === "admissions") return "/admissions";
  if (category === "admit-cards") return "/admit-cards";
  if (category === "schemes") return "/schemes";
  if (category === "exams") return "/exams";
  if (category === "scholarships") return "/scholarships";
  return "/";
}

function normalizeImportantDates(value: any): ImportantDateRow[] {
  if (!Array.isArray(value)) return [];

  return value.map((item, index) => ({
    id: item?.id || `date_${index}`,
    type: item?.type || "",
    label: item?.label || "",
    value: item?.value || "",
  }));
}

function normalizeImportantLinks(
  value: any,
  sourceUrl?: string
): ImportantLinkRow[] {
  const rows = Array.isArray(value)
    ? value.map((item, index) => ({
        id: item?.id || `link_${index}`,
        type: item?.type || "",
        label: item?.label || "",
        url: item?.url || "",
      }))
    : [];

  if (rows.length === 0 && sourceUrl) {
    rows.push({
      id: "source_link",
      type: "Official Website",
      label: "Official Website",
      url: sourceUrl,
    });
  }

  return rows;
}

function normalizeJobInfoPanels(value: any): JobInfoPanel[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => ({
      id: item?.id || `panel_${index}`,
      organization: item?.organization || "",
      postName: item?.postName || "",
      totalVacancy: item?.totalVacancy || "",
      qualification: item?.qualification || "",
      ageLimit: item?.ageLimit || "",
      salary: item?.salary || "",
    }))
    .filter((panel) => {
      return (
        panel.organization?.trim() ||
        panel.postName?.trim() ||
        panel.totalVacancy?.trim() ||
        panel.qualification?.trim() ||
        panel.ageLimit?.trim() ||
        panel.salary?.trim()
      );
    });
}

function normalizeQuickInfoRows(value: any): QuickInfoRow[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => ({
      id: item?.id || `info_${index}`,
      type: item?.type || "",
      label: item?.label || "",
      value: item?.value || "",
    }))
    .filter((item) => {
      return item.value?.trim() && (item.label?.trim() || item.type?.trim());
    });
}

function panelToRows(panel: JobInfoPanel): InfoRow[] {
  return [
    {
      label: "Organization / Department",
      value: panel.organization || "",
    },
    {
      label: "Post Name",
      value: panel.postName || "",
    },
    {
      label: "Total Vacancy",
      value: panel.totalVacancy || "",
    },
    {
      label: "Qualification",
      value: panel.qualification || "",
    },
    {
      label: "Age Limit",
      value: panel.ageLimit || "",
    },
    {
      label: "Salary / Pay Scale",
      value: panel.salary || "",
    },
  ];
}

function buildInfoSections(post: PostData): InfoSection[] {
  if (post.category !== "jobs") return [];

  if (post.jobInfoPanels && post.jobInfoPanels.length > 0) {
    return post.jobInfoPanels.map((panel, index) => ({
      title: `Quick Information - Post ${index + 1}`,
      rows: panelToRows(panel),
    }));
  }

  if (post.quickInfoRows && post.quickInfoRows.length > 0) {
    return [
      {
        title: "Quick Information",
        rows: post.quickInfoRows.map((row) => ({
          label: row.label || row.type || "Details",
          value: row.value || "",
        })),
      },
    ];
  }

  const oldPanel: JobInfoPanel = {
    organization: post.organization || post.department || "",
    postName: post.postName || "",
    totalVacancy: post.totalVacancy || "",
    qualification: post.qualification || "",
    ageLimit: post.ageLimit || "",
    salary: post.salary || post.payScale || "",
  };

  return [
    {
      title: "Quick Information",
      rows: panelToRows(oldPanel),
    },
  ];
}

function mapToCommonPost(post: PostData): CommonPostDetailData {
  return {
    title: post.title,
    category: post.category || "post",
    subCategories: post.subCategories || [],

    shortDescription: post.shortDescription || post.excerpt || "",
    description: post.description || post.content || "",

    previewImageUrl:
      post.previewImageUrl || post.imageUrl || post.shareImage || "",

    youtubeUrl: post.youtubeUrl || "",

    shareTitle: post.shareTitle || post.title,
    shareDescription:
      post.shareDescription || post.shortDescription || post.excerpt || "",

    importantDates: post.importantDates || [],
    importantLinks: post.importantLinks || [],

    infoSections: buildInfoSections(post),
  };
}

export default function PublicPostDetailsPage() {
  const params = useParams();

  const rawSlug =
    typeof params.slug === "string"
      ? params.slug
      : Array.isArray(params.slug)
      ? params.slug[0]
      : "";

  const pageSlug = decodeURIComponent(rawSlug);

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, "posts"));

        const allPosts: PostData[] = snapshot.docs.map((docItem) => {
          const data = docItem.data();

          return {
            id: docItem.id,
            title: data.title || "",
            slug: data.slug || "",

            category: data.category || "",
            subCategory: data.subCategory || "",
            subCategories: Array.isArray(data.subCategories)
              ? data.subCategories
              : data.subCategory
              ? [data.subCategory]
              : [],

            excerpt: data.excerpt || "",
            content: data.content || "",

            shortDescription: data.shortDescription || "",
            description: data.description || "",

            imageUrl: data.imageUrl || "",
            previewImageUrl: data.previewImageUrl || "",
            shareImage: data.shareImage || "",

            youtubeUrl: data.youtubeUrl || "",

            shareTitle: data.shareTitle || "",
            shareDescription: data.shareDescription || "",

            jobInfoPanels: normalizeJobInfoPanels(data.jobInfoPanels),
            quickInfoRows: normalizeQuickInfoRows(data.quickInfoRows),

            importantDates: normalizeImportantDates(data.importantDates),
            importantLinks: normalizeImportantLinks(
              data.importantLinks,
              data.sourceUrl || ""
            ),

            sourceUrl: data.sourceUrl || "",

            organization: data.organization || "",
            department: data.department || "",
            postName: data.postName || "",
            totalVacancy: data.totalVacancy || "",
            qualification: data.qualification || "",
            ageLimit: data.ageLimit || "",
            salary: data.salary || "",
            payScale: data.payScale || "",

            status: data.status || "published",
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
          };
        });

        const foundPost =
          allPosts.find((item) => item.slug === pageSlug) ||
          allPosts.find((item) => item.id === pageSlug) ||
          null;

        setPost(foundPost);
      } catch (error) {
        console.error(error);
        alert("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [pageSlug]);

  const commonPost = useMemo(() => {
    if (!post) return null;
    return mapToCommonPost(post);
  }, [post]);

  if (loading) {
    return (
      <main className="post-details-main">
        <p className="post-loading-text">Loading post...</p>
      </main>
    );
  }

  if (!post || !commonPost) {
    return (
      <main className="post-details-main">
        <Link href="/" className="post-back-link">
          ← Back to Home
        </Link>

        <div className="post-not-found-card">
          <h1>Post not found</h1>
          <p>This post may have been removed or the link may be wrong.</p>
        </div>
      </main>
    );
  }

  return (
    <PostDetailLayout post={commonPost} backHref={getBackLink(post.category)} />
  );
}