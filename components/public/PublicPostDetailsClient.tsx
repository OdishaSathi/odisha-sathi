"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PostDetailLayout, {
  CommonPostDetailData,
  ImportantDateRow,
  ImportantLinkRow,
  InfoRow,
  InfoSection,
  RelatedPostRow,
  VideoRow,
  DetailContentSection,
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
  youtubeUrls?: string[];
  youtubeVideos?: VideoRow[];
  videos?: VideoRow[];

  postUrl?: string;
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

  relatedPosts?: RelatedPostRow[];

  syllabus?: string;
  examPattern?: string;
  selectionProcedure?: string;
  contentSections?: DetailContentSection[];

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

function normalizeText(value: any) {
  return String(value || "").trim().toLowerCase();
}

function getPostHref(post: PostData) {
  return `/post/${post.slug || post.id}`;
}

function getAbsolutePostUrl(post: PostData) {
  return `https://odishasathi.in${getPostHref(post)}`;
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

function normalizeYoutubeUrls(data: any): string[] {
  const urls: string[] = [];

  const addUrl = (value: any) => {
    if (typeof value !== "string") return;

    const cleanUrl = value.trim();

    if (cleanUrl) {
      urls.push(cleanUrl);
    }
  };

  if (Array.isArray(data.youtubeUrls)) {
    data.youtubeUrls.forEach(addUrl);
  }

  addUrl(data.youtubeUrl2);
  addUrl(data.youtubeUrl3);
  addUrl(data.videoUrl2);
  addUrl(data.videoUrl3);
  addUrl(data.youtubeShortsUrl);

  return Array.from(new Set(urls));
}

function normalizeVideoRows(value: any): VideoRow[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          title: `Video Guide ${index + 1}`,
          url: item,
        };
      }

      return {
        title: item?.title || item?.label || `Video Guide ${index + 1}`,
        url: item?.url || item?.youtubeUrl || item?.videoUrl || item?.link || "",
      };
    })
    .filter((item) => item.url?.trim());
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
      title: panel.postName?.trim() || `Post Details ${index + 1}`,
      rows: panelToRows(panel),
    }));
  }

  if (post.quickInfoRows && post.quickInfoRows.length > 0) {
    return [
      {
        title: "Post Details",
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
      title: oldPanel.postName?.trim() || "Post Details",
      rows: panelToRows(oldPanel),
    },
  ];
}

function buildRelatedPosts(
  currentPost: PostData,
  allPosts: PostData[]
): RelatedPostRow[] {
  const currentCategory = normalizeText(currentPost.category);
  const currentSubCategories = new Set(
    [
      currentPost.subCategory,
      ...(currentPost.subCategories || []),
    ]
      .map(normalizeText)
      .filter(Boolean)
  );

  const isJobsPost = currentCategory === "jobs";

  const candidates = allPosts.filter((item) => {
    const sameId = item.id === currentPost.id;
    const sameSlug = item.slug && item.slug === currentPost.slug;

    if (sameId || sameSlug || !item.title?.trim()) return false;

    const itemCategory = normalizeText(item.category);

    if (isJobsPost) {
      return itemCategory === "jobs";
    }

    if (currentCategory) {
      return itemCategory === currentCategory;
    }

    return true;
  });

  const scoredCandidates = candidates
    .map((item) => {
      const itemSubCategories = [
        item.subCategory,
        ...(item.subCategories || []),
      ]
        .map(normalizeText)
        .filter(Boolean);

      const sharedSubCategoryCount = itemSubCategories.filter((subCategory) =>
        currentSubCategories.has(subCategory)
      ).length;

      let score = 0;

      if (sharedSubCategoryCount > 0) score += sharedSubCategoryCount * 20;
      if (normalizeText(item.category) === currentCategory) score += 10;

      return {
        item,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return scoredCandidates.slice(0, 5).map(({ item }) => ({
    title: item.title,
    slug: item.slug || item.id,
    category: item.category || "",
    subCategory: item.subCategory || "",
    href: getPostHref(item),
  }));
}

function buildContentSections(post: PostData): DetailContentSection[] {
  const sections: DetailContentSection[] = [];

  if (post.syllabus?.trim()) {
    sections.push({
      id: "syllabus",
      title: "Syllabus",
      content: post.syllabus.trim(),
    });
  }

  if (post.examPattern?.trim()) {
    sections.push({
      id: "exam-pattern",
      title: "Exam Pattern",
      content: post.examPattern.trim(),
    });
  }

  if (post.selectionProcedure?.trim()) {
    sections.push({
      id: "selection-procedure",
      title: "Selection Procedure",
      content: post.selectionProcedure.trim(),
    });
  }

  if (Array.isArray(post.contentSections)) {
    post.contentSections.forEach((section) => {
      if (section?.title?.trim() && section?.content?.trim()) {
        sections.push({
          id: section.id || "",
          title: section.title.trim(),
          content: section.content.trim(),
        });
      }
    });
  }

  return sections;
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
    youtubeUrls: post.youtubeUrls || [],
    youtubeVideos: post.youtubeVideos || [],
    videos: post.videos || [],

    postUrl: post.postUrl || getAbsolutePostUrl(post),
    shareTitle: post.shareTitle || post.title,
    shareDescription:
      post.shareDescription ||
      post.shortDescription ||
      post.excerpt ||
      post.description ||
      "",

    importantDates: post.importantDates || [],
    importantLinks: post.importantLinks || [],

    infoSections: buildInfoSections(post),
    relatedPosts: post.relatedPosts || [],
    contentSections: buildContentSections(post),

    status: post.status || "",
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
            youtubeUrls: normalizeYoutubeUrls(data),
            youtubeVideos: normalizeVideoRows(data.youtubeVideos),
            videos: normalizeVideoRows(data.videos),

            postUrl: data.postUrl || "",
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

            syllabus: data.syllabus || "",
            examPattern: data.examPattern || "",
            selectionProcedure: data.selectionProcedure || "",
            contentSections: Array.isArray(data.contentSections)
              ? data.contentSections
              : [],

            status: data.status || "published",
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
          };
        });

        const foundPost =
          allPosts.find((item) => item.slug === pageSlug) ||
          allPosts.find((item) => item.id === pageSlug) ||
          null;

        if (foundPost) {
          const relatedPosts = buildRelatedPosts(foundPost, allPosts);

          setPost({
            ...foundPost,
            relatedPosts,
          });
        } else {
          setPost(null);
        }
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