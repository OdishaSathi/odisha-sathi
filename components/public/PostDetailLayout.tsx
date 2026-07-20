"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategoryLabel } from "@/lib/defaultImages";
import { buildPostShareMessage } from "@/lib/postShare";
import type {
  JobFeeRow,
  JobInfoPanel,
  RequiredDocumentRow,
} from "@/lib/jobDetails";

export type ImportantDateRow = {
  id?: string;
  type?: string;
  label?: string;
  value?: string;
};

export type ImportantLinkRow = {
  id?: string;
  type?: string;
  label?: string;
  url?: string;
};

export type InfoRow = {
  label: string;
  value?: string;
};

export type InfoSection = {
  title: string;
  rows: InfoRow[];
};

export type VideoRow = {
  title?: string;
  url?: string;
};

export type RelatedPostRow = {
  title: string;
  slug?: string;
  category?: string;
  subCategory?: string;
  href?: string;
};

export type DetailContentSection = {
  id?: string;
  title: string;
  content?: string;
};

type TableOfContentsItem = {
  id: string;
  title: string;
};

export type CommonPostDetailData = {
  title: string;
  category?: string;
  subCategories?: string[];

  shortDescription?: string;
  description?: string;
  notificationNumber?: string;
  previewImageUrl?: string;

  shareTitle?: string;
  shareDescription?: string;
  postUrl?: string;

  youtubeUrl?: string;
  youtubeUrls?: string[];
  youtubeVideos?: VideoRow[];
  videos?: VideoRow[];

  importantDates?: ImportantDateRow[];
  importantLinks?: ImportantLinkRow[];

  infoRows?: InfoRow[];
  infoSections?: InfoSection[];
  jobDetails?: JobInfoPanel[];
  feeStructureRows?: JobFeeRow[];
  documentsRequired?: RequiredDocumentRow[];

  status?: string;
  createdAt?: string;
  updatedAt?: string;

  relatedPosts?: RelatedPostRow[];
  contentSections?: DetailContentSection[];
};

type PostDetailLayoutProps = {
  post: CommonPostDetailData;
  backHref?: string;
};

function getDisplayLabel(type?: string, label?: string): string {
  if (label?.trim()) return label.trim();
  if (type?.trim()) return type.trim();
  return "Details";
}

function getShareCategory(category?: string) {
  const value = String(category || "").toLowerCase();
  if (value === "jobs" || value === "job") return "Job";
  if (value === "admissions" || value === "admission") return "Admission";
  if (value === "results" || value === "result") return "Result";
  if (value.includes("admit") || value === "exams" || value === "exam") {
    return "Admit Card & Exam";
  }
  if (value === "schemes" || value === "scheme") return "Government Scheme";
  if (value === "scholarships" || value === "scholarship") {
    return "Scholarship";
  }
  return getCategoryLabel(category).replace(/^Latest\s+/i, "");
}

function cleanDateRows(rows?: ImportantDateRow[]): ImportantDateRow[] {
  return (rows || []).filter((row) => {
    return row.value?.trim() || row.label?.trim() || row.type?.trim();
  });
}

function cleanLinkRows(rows?: ImportantLinkRow[]): ImportantLinkRow[] {
  return (rows || []).filter((row) => row.url?.trim());
}

function cleanInfoRows(rows?: InfoRow[]): InfoRow[] {
  return (rows || []).filter((row) => row.value?.trim());
}

function isPostNameLabel(label: string) {
  const text = label.toLowerCase().trim();
  return (
    text === "post name" ||
    text === "post" ||
    text === "job name" ||
    text === "designation"
  );
}

function getPostNameFromRows(rows?: InfoRow[]) {
  const postRow = (rows || []).find((row) => isPostNameLabel(row.label));
  return postRow?.value?.trim() || "";
}

function removePostNameRows(rows?: InfoRow[]) {
  return cleanInfoRows(rows).filter((row) => !isPostNameLabel(row.label));
}

function prepareInfoSections(
  sections?: InfoSection[],
  fallbackRows?: InfoRow[]
): InfoSection[] {
  const preparedSections = (sections || [])
    .map((section, index) => {
      const postName = getPostNameFromRows(section.rows);
      const cleanedRows = removePostNameRows(section.rows);

      let title = section.title?.trim() || "";

      if (
        !title ||
        title.toLowerCase().includes("quick information") ||
        title.toLowerCase().includes("post")
      ) {
        title = postName || `Post Details ${index + 1}`;
      }

      return {
        title,
        rows: cleanedRows,
      };
    })
    .filter((section) => section.rows.length > 0);

  if (preparedSections.length > 0) return preparedSections;

  const fallbackPostName = getPostNameFromRows(fallbackRows);
  const fallbackCleanRows = removePostNameRows(fallbackRows);

  if (fallbackCleanRows.length === 0) return [];

  return [
    {
      title: fallbackPostName || "Post Details",
      rows: fallbackCleanRows,
    },
  ];
}

function getDateTone(row: ImportantDateRow): string {
  const text = `${row.type || ""} ${row.label || ""}`.toLowerCase();

  if (
    text.includes("last") ||
    text.includes("closing") ||
    text.includes("end") ||
    text.includes("final") ||
    text.includes("deadline")
  ) {
    return "danger";
  }

  if (
    text.includes("start") ||
    text.includes("opening") ||
    text.includes("begin") ||
    text.includes("registration") ||
    text.includes("apply online")
  ) {
    return "success";
  }

  if (
    text.includes("exam") ||
    text.includes("admit") ||
    text.includes("result") ||
    text.includes("merit") ||
    text.includes("selection") ||
    text.includes("interview")
  ) {
    return "info";
  }

  return "normal";
}

function getStatusTone(status?: string): string {
  const text = (status || "").toLowerCase();

  if (text.includes("closed") || text.includes("expired")) return "danger";
  if (text.includes("upcoming")) return "warning";
  if (text.includes("result")) return "info";
  if (
    text.includes("active") ||
    text.includes("released") ||
    text.includes("available") ||
    text.includes("open")
  ) {
    return "success";
  }

  return "info";
}

function getLinkButtonText(row: ImportantLinkRow): string {
  const text = getDisplayLabel(row.type, row.label).toLowerCase();

  if (text.includes("apply")) return "Apply Now";
  if (text.includes("notification")) return "Download";
  if (text.includes("admit")) return "Download";
  if (text.includes("result")) return "Check Now";
  if (text.includes("website")) return "Visit";
  return "Open Link";
}

function getYouTubeId(url?: string) {
  if (!url) return "";

  const cleanUrl = url.trim();

  const patterns = [
    /youtu\.be\/([^?&/]+)/,
    /youtube\.com\/watch\?v=([^?&/]+)/,
    /youtube\.com\/embed\/([^?&/]+)/,
    /youtube\.com\/shorts\/([^?&/]+)/,
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "";
}

function normalizeVideos(post: CommonPostDetailData): VideoRow[] {
  const videoMap = new Map<string, VideoRow>();

  const addVideo = (video?: string | VideoRow) => {
    if (!video) return;

    if (typeof video === "string") {
      const url = video.trim();
      const id = getYouTubeId(url);
      if (url && id) {
        videoMap.set(url, { url });
      }
      return;
    }

    const url = video.url?.trim();
    const id = getYouTubeId(url);

    if (url && id) {
      videoMap.set(url, {
        title: video.title?.trim(),
        url,
      });
    }
  };

  addVideo(post.youtubeUrl);

  (post.youtubeUrls || []).forEach(addVideo);
  (post.youtubeVideos || []).forEach(addVideo);
  (post.videos || []).forEach(addVideo);

  return Array.from(videoMap.values());
}

function findInfoValue(sections: InfoSection[], labels: string[]) {
  const lowerLabels = labels.map((item) => item.toLowerCase());

  for (const section of sections) {
    for (const row of section.rows) {
      const label = row.label.toLowerCase();
      if (lowerLabels.some((item) => label.includes(item))) {
        return row.value?.trim() || "";
      }
    }
  }

  return "";
}

function normalizeAnchorId(value: string, fallback: string) {
  const cleanValue = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleanValue || fallback;
}

function cleanContentSections(sections?: DetailContentSection[]): DetailContentSection[] {
  return (sections || [])
    .map((section, index) => ({
      id: section.id?.trim() || normalizeAnchorId(section.title, `section-${index + 1}`),
      title: section.title?.trim() || `Section ${index + 1}`,
      content: section.content?.trim() || "",
    }))
    .filter((section) => section.title && section.content);
}

function DetailDescription({ description }: { description?: string }) {
  if (!description?.trim()) {
    return (
      <div className="post-detail-description muted">
        Details will be updated soon.
      </div>
    );
  }

  return <div className="post-detail-description">{description}</div>;
}

export default function PostDetailLayout({
  post,
  backHref = "/",
}: PostDetailLayoutProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [nativeShareAvailable, setNativeShareAvailable] = useState(false);

  useEffect(() => {
    setIsDesktop(!/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
    setNativeShareAvailable(typeof navigator.share === "function");
  }, []);

  const categoryLabel = getCategoryLabel(post.category);
  const shareCategory = getShareCategory(post.category);

  const importantDates = cleanDateRows(post.importantDates);
  const importantLinks = cleanLinkRows(post.importantLinks);

  const quickInfoSections = prepareInfoSections(post.infoSections, post.infoRows);
  const videos = normalizeVideos(post);

  const shareTitle = post.shareTitle?.trim() || post.title;

  const shareDescription =
    post.shareDescription?.trim() ||
    post.shortDescription?.trim() ||
    post.description?.trim() ||
    "";

  const shareUrl = post.postUrl?.trim() || "";

  const departmentName =
    findInfoValue(quickInfoSections, ["organization", "department"]) ||
    "Department / Organization";

  const postNames =
    post.subCategories?.join(", ") ||
    quickInfoSections.map((section) => section.title).filter(Boolean).join(", ") ||
    post.title;

  const relatedPosts = (post.relatedPosts || []).slice(0, 5);
  const contentSections = cleanContentSections(post.contentSections);
  const isJobDetail = post.category === "jobs";
  const whatsappShareText = isJobDetail
    ? buildPostShareMessage({
        title: shareTitle,
        category: shareCategory,
        url: shareUrl,
        description: shareDescription,
        importantDates,
      })
    : buildPostShareMessage({
        title: shareTitle,
        category: shareCategory,
        url: shareUrl,
        importantDates,
      });
  const whatsappBase = isDesktop
    ? "https://web.whatsapp.com/send"
    : "https://wa.me/";

  const copyPostLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const input = document.createElement("textarea");
      input.value = shareUrl;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }

    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 1800);
  };

  const shareWithAnotherApp = async () => {
    if (!nativeShareAvailable || !shareUrl) return;
    try {
      await navigator.share({
        title: shareTitle,
        text: whatsappShareText,
        url: shareUrl,
      });
    } catch (error) {
      if ((error as DOMException)?.name !== "AbortError") {
        console.warn("Native post sharing was unavailable", error);
      }
    }
  };
  const jobDetails = isJobDetail ? post.jobDetails || [] : [];
  const hasVacancyDetails = jobDetails.some((panel) =>
    panel.vacancyCategories.some(
      (row) => row.total.trim() || row.male.trim() || row.female.trim()
    )
  );
  const hasAgeDetails = jobDetails.some(
    (panel) =>
      panel.ageLimit.trim() ||
      panel.ageCutoffDate.trim() ||
      panel.ageCriteria.some(
        (row) =>
          row.category.trim() &&
          (row.minimumAge.trim() ||
            row.maximumAge.trim() ||
            row.relaxation.trim())
      )
  );
  const hasQualificationDetails = jobDetails.some((panel) =>
    panel.qualification.trim()
  );
  const feeStructureRows = post.feeStructureRows || [];
  const documentsRequired = post.documentsRequired || [];
  const hasFeeStructureDetails = feeStructureRows.some((row) => row.fee.trim());
  const hasDocumentDetails = documentsRequired.some(
    (item) => item.required && item.name.trim()
  );
  const firstVideo = videos[0];
  const firstVideoId = getYouTubeId(firstVideo?.url);
  const youtubeBannerUrl = firstVideoId
    ? `https://i.ytimg.com/vi/${firstVideoId}/hqdefault.jpg`
    : "";

  const tableOfContents: TableOfContentsItem[] = isJobDetail
    ? [
        post.description?.trim() ? { id: "description", title: "Description" } : null,
        quickInfoSections.length > 0
          ? { id: "post-details", title: "Post Details" }
          : null,
        hasVacancyDetails
          ? { id: "category-wise-vacancy", title: "Category-wise Vacancy" }
          : null,
        hasAgeDetails ? { id: "age-criteria", title: "Age Criteria" } : null,
        hasFeeStructureDetails
          ? { id: "fee-structure", title: "Fee Structure" }
          : null,
        hasQualificationDetails
          ? {
              id: "educational-qualification",
              title: "Educational Qualification",
            }
          : null,
        hasDocumentDetails
          ? { id: "documents-required", title: "Documents Required" }
          : null,
        ...contentSections.map((section) => ({
          id: section.id || normalizeAnchorId(section.title, "content-section"),
          title: section.title,
        })),
        importantDates.length > 0
          ? { id: "important-dates", title: "Important Dates" }
          : null,
        importantLinks.length > 0
          ? { id: "important-links", title: "Important Links" }
          : null,
        videos.length > 0 ? { id: "video-guide", title: "Video Guide" } : null,
        { id: "share-this-post", title: "Sharing Buttons" },
      ].filter(Boolean) as TableOfContentsItem[]
    : [];

  return (
    <main className="post-detail-page">
      <div className="post-detail-container">
        <div className="post-detail-breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href={backHref}>{categoryLabel}</Link>
          <span>/</span>
          <span>{post.title}</span>
        </div>

        <Link href={backHref} className="post-detail-back-link">
          ← Back
        </Link>

        <article className="post-detail-shell">
          <header className="post-detail-header">
            <h1>{post.title}</h1>

            <div className="post-detail-badge-row">
              <span className="post-detail-category-badge">{categoryLabel}</span>

              {post.status?.trim() ? (
                <span
                  className={`post-detail-status-badge ${getStatusTone(
                    post.status
                  )}`}
                >
                  {post.status}
                </span>
              ) : null}
            </div>

            {post.subCategories && post.subCategories.length > 0 ? (
              <div className="post-detail-chip-row">
                {post.subCategories.map((item) => (
                  <span key={item} className="post-detail-chip">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}

            {post.shortDescription ? (
              <p className="post-detail-short-description">
                {post.shortDescription}
              </p>
            ) : null}

            {post.notificationNumber?.trim() ? (
              <p className="post-detail-notification-number">
                Notification No.: <strong>{post.notificationNumber.trim()}</strong>
              </p>
            ) : null}
          </header>

          <div className="post-detail-grid">
            <section className="post-detail-main">
              <PostBanner
                title={post.title}
                uploadedImageUrl={post.previewImageUrl || ""}
                youtubeBannerUrl={youtubeBannerUrl}
                youtubeUrl={firstVideo?.url || ""}
                categoryLabel={categoryLabel}
                departmentName={departmentName}
                postNames={postNames}
              />

              {tableOfContents.length > 1 ? (
                <TableOfContents items={tableOfContents} />
              ) : null}

              {post.description?.trim() ? (
                <section className="post-detail-section" id="description">
                  <SectionHeader title="Description" />
                  <DetailDescription description={post.description} />
                </section>
              ) : null}

              {quickInfoSections.length > 0 ? (
                quickInfoSections.map((section, index) => (
                  <QuickInfoTable
                    key={section.title}
                    id={index === 0 ? "post-details" : undefined}
                    title={section.title}
                    rows={section.rows}
                  />
                ))
              ) : null}

              {isJobDetail ? (
                <>
                  <JobVacancySection panels={jobDetails} />
                  <JobAgeSection panels={jobDetails} />
                  <JobFeeStructureSection rows={feeStructureRows} />
                  <JobQualificationSection panels={jobDetails} />
                  <JobDocumentsSection documents={documentsRequired} />
                </>
              ) : null}

              {isJobDetail
                ? contentSections.map((section) => (
                    <DetailTextSection
                      key={section.id || section.title}
                      section={section}
                    />
                  ))
                : null}

              {importantDates.length > 0 ? (
                <section className="post-detail-section" id="important-dates">
                  <SectionHeader title="Important Dates" />

                  <div className="post-detail-date-list">
                    {importantDates.map((row, index) => (
                      <div
                        key={row.id || `${row.type}-${index}`}
                        className={`post-detail-date-row ${getDateTone(row)}`}
                      >
                        <span>{getDisplayLabel(row.type, row.label)}</span>
                        <strong>{row.value || "-"}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {importantLinks.length > 0 ? (
                <section className="post-detail-section" id="important-links">
                  <SectionHeader title="Important Links" />

                  <div className="post-detail-link-list">
                    {importantLinks.map((row, index) => (
                      <a
                        key={row.id || `${row.type}-${index}`}
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="post-detail-link-row"
                      >
                        <span>{getDisplayLabel(row.type, row.label)}</span>
                        <strong>{getLinkButtonText(row)}</strong>
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}

              {!isJobDetail
                ? contentSections.map((section) => (
                    <DetailTextSection
                      key={section.id || section.title}
                      section={section}
                    />
                  ))
                : null}

              <VideoGuideSection videos={videos} title={post.title} />

              <section className="post-detail-share-section" id="share-this-post">
                <p>Share this post to Your Friends and relatives</p>

                <div className="post-detail-share-actions">
                  <span className="share-pointer" aria-hidden="true">
                    ➜
                  </span>

                  <a
                    href={`${whatsappBase}?text=${encodeURIComponent(
                      whatsappShareText
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn whatsapp"
                  >
                    <span className="share-icon" aria-hidden="true">
  <WhatsAppIcon />
</span>
WhatsApp
                  </a>

                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(
                      shareUrl
                    )}&text=${encodeURIComponent(whatsappShareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn telegram"
                  >
                    <span className="share-icon" aria-hidden="true">
  <TelegramIcon />
</span>
Telegram
                  </a>

                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      shareUrl
                    )}&quote=${encodeURIComponent(whatsappShareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="share-btn facebook"
                  >
                    <span className="share-icon" aria-hidden="true">
                      <FacebookIcon />
                    </span>
                    Facebook
                  </a>

                  {nativeShareAvailable ? (
                    <button
                      type="button"
                      className="share-btn more-share"
                      onClick={shareWithAnotherApp}
                      title="Share using another installed app"
                    >
                      <span className="share-icon" aria-hidden="true">
                        <MoreShareIcon />
                      </span>
                      More
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="share-btn copy-link"
                    onClick={copyPostLink}
                    disabled={!shareUrl}
                    aria-live="polite"
                    title="Copy this post link"
                  >
                    <span className="share-icon" aria-hidden="true">
                      <CopyLinkIcon />
                    </span>
                    {linkCopied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </section>
            </section>

            <aside className="post-detail-sidebar">
              <div className="post-detail-side-card">
                <div className="side-card-title-row">
                  <h3>Related Jobs</h3>
                  <Link href={backHref}>View More</Link>
                </div>

                {relatedPosts.length > 0 ? (
                  <div className="post-detail-related-list">
                    {relatedPosts.map((item, index) => {
                      const href =
                        item.href ||
                        (item.slug ? `/post/${item.slug}` : backHref);

                      return (
                        <Link href={href} key={`${item.title}-${index}`}>
                          {item.title}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="post-detail-side-muted">
                    Related jobs will be shown here after connecting related post
                    data.
                  </p>
                )}
              </div>

              <div className="post-detail-side-card">
                <h3>Quick Access</h3>

                <div className="post-detail-quick-access">
                  <Link href="/jobs">Latest Jobs</Link>
                  <Link href="/admit-cards">Admit Cards</Link>
                  <Link href="/results">Results</Link>
                  <Link href="/admissions">Admissions</Link>
                  <Link href="/schemes">Schemes</Link>
                  <Link href="/tools">Tools</Link>
                </div>
              </div>
            </aside>
          </div>
        </article>
      </div>

      <PostDetailStyles />
    </main>
  );
}

function TableOfContents({ items }: { items: TableOfContentsItem[] }) {
  return (
    <nav className="post-detail-toc" aria-label="Table of contents">
      <div className="post-detail-toc-title">Contents</div>

      <div className="post-detail-toc-list">
        {items.map((item) => (
          <a key={item.id} href={`#${item.id}`}>
            {item.title}
          </a>
        ))}
      </div>
    </nav>
  );
}

function DetailTextSection({ section }: { section: DetailContentSection }) {
  return (
    <section className="post-detail-section" id={section.id}>
      <SectionHeader title={section.title} />
      <div className="post-detail-description">{section.content}</div>
    </section>
  );
}

function DefaultPostBanner({
  categoryLabel,
  departmentName,
  postNames,
}: {
  categoryLabel: string;
  departmentName: string;
  postNames: string;
}) {
  return (
    <div className="default-post-banner">
      <div className="default-banner-logo">
        <img src="/odisha-sathi-logo.png" alt="Odisha Sathi Logo" />
      </div>

      <div className="default-banner-content">
        <p className="default-banner-kicker">
          Odisha Sathi {categoryLabel} Update
        </p>
        <h2>{departmentName}</h2>
        <h3>{postNames}</h3>

        <div className="default-banner-tags">
          <span>Post Details</span>
          <span>Eligibility</span>
          <span>Age Criteria</span>
          <span>Important Dates</span>
          <span>Apply Procedure</span>
        </div>
      </div>
    </div>
  );
}

function PostBanner({
  title,
  uploadedImageUrl,
  youtubeBannerUrl,
  youtubeUrl,
  categoryLabel,
  departmentName,
  postNames,
}: {
  title: string;
  uploadedImageUrl: string;
  youtubeBannerUrl: string;
  youtubeUrl: string;
  categoryLabel: string;
  departmentName: string;
  postNames: string;
}) {
  const [uploadedImageFailed, setUploadedImageFailed] = useState(false);

  useEffect(() => {
    setUploadedImageFailed(false);
  }, [uploadedImageUrl]);

  if (uploadedImageUrl.trim() && !uploadedImageFailed) {
    return (
      <div className="post-detail-image-box">
        <img
          src={uploadedImageUrl.trim()}
          alt={title}
          onError={() => setUploadedImageFailed(true)}
        />
      </div>
    );
  }

  if (youtubeBannerUrl) {
    return (
      <a
        className="post-detail-image-box youtube-banner"
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Watch ${title} video on YouTube`}
      >
        <img src={youtubeBannerUrl} alt={`${title} video thumbnail`} />
        <span>Watch Video</span>
      </a>
    );
  }

  return (
    <DefaultPostBanner
      categoryLabel={categoryLabel}
      departmentName={departmentName}
      postNames={postNames}
    />
  );
}

function QuickInfoTable({ id, title, rows }: { id?: string; title: string; rows: InfoRow[] }) {
  const cleanRows = cleanInfoRows(rows);

  if (cleanRows.length === 0) {
    return null;
  }

  return (
    <section className="post-detail-section" id={id}>
      <SectionHeader title={title} />

      <div className="post-detail-info-table">
        {cleanRows.map((row, index) => (
          <div key={`${row.label}-${index}`}>
            <span>{row.label}</span>
            <strong>{row.value || "-"}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function getPanelTitle(panel: JobInfoPanel, index: number) {
  return panel.postName.trim() || `Post ${index + 1}`;
}

function getCalculatedVacancyTotal(panel: JobInfoPanel) {
  if (panel.totalVacancy.trim()) return panel.totalVacancy.trim();

  const totals = panel.vacancyCategories
    .filter((row) => row.total.trim() || row.male.trim() || row.female.trim())
    .map((row) => {
    const value = row.total.replace(/[^0-9.-]/g, "");
    return value ? Number(value) : Number.NaN;
    });

  if (totals.length === 0 || totals.some((value) => Number.isNaN(value))) {
    return "";
  }

  return String(totals.reduce((sum, value) => sum + value, 0));
}

function JobVacancySection({ panels }: { panels: JobInfoPanel[] }) {
  const visiblePanels = panels
    .map((panel, index) => ({
      panel,
      index,
      rows: panel.vacancyCategories.filter(
        (row) => row.total.trim() || row.male.trim() || row.female.trim()
      ),
    }))
    .filter((item) => item.rows.length > 0);

  if (visiblePanels.length === 0) return null;

  return (
    <section className="post-detail-section" id="category-wise-vacancy">
      <SectionHeader title="Category-wise Vacancy" />

      <div className="job-detail-stack-list">
        {visiblePanels.map(({ panel, index, rows }) => {
          const totalVacancy = getCalculatedVacancyTotal(panel);

          return (
            <div className="job-detail-data-block" key={panel.id}>
              <h3>{getPanelTitle(panel, index)}</h3>

              <div className="job-detail-table-scroll">
                <table className="job-detail-data-table vacancy-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Total</th>
                      <th>Male</th>
                      <th>Female</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <th scope="row">{row.category}</th>
                        <td>{row.total || "—"}</td>
                        <td>{row.male || "—"}</td>
                        <td>{row.female || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalVacancy ? (
                <p className="job-detail-total-vacancy">
                  Total Number of Vacancies: <strong>{totalVacancy}</strong>
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function JobAgeSection({ panels }: { panels: JobInfoPanel[] }) {
  const visiblePanels = panels
    .map((panel, index) => ({
      panel,
      index,
      rows: panel.ageCriteria.filter(
        (row) =>
          row.category.trim() &&
          (row.minimumAge.trim() ||
            row.maximumAge.trim() ||
            row.relaxation.trim())
      ),
    }))
    .filter(
      ({ panel, rows }) =>
        panel.ageLimit.trim() || panel.ageCutoffDate.trim() || rows.length > 0
    );

  if (visiblePanels.length === 0) return null;

  return (
    <section className="post-detail-section" id="age-criteria">
      <SectionHeader title="Age Criteria" />

      <div className="job-detail-stack-list">
        {visiblePanels.map(({ panel, index, rows }) => (
          <div className="job-detail-data-block" key={panel.id}>
            <h3>{getPanelTitle(panel, index)}</h3>

            {panel.ageLimit.trim() || panel.ageCutoffDate.trim() ? (
              <div className="job-detail-summary-grid">
                {panel.ageLimit.trim() ? (
                  <div>
                    <span>General Age Limit</span>
                    <strong>{panel.ageLimit}</strong>
                  </div>
                ) : null}

                {panel.ageCutoffDate.trim() ? (
                  <div>
                    <span>Age Calculated as on</span>
                    <strong>{panel.ageCutoffDate}</strong>
                  </div>
                ) : null}
              </div>
            ) : null}

            {rows.length > 0 ? (
              <div className="job-detail-table-scroll">
                <table className="job-detail-data-table age-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Minimum Age</th>
                      <th>Maximum Age</th>
                      <th>Relaxation / Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <th scope="row">{row.category}</th>
                        <td>{row.minimumAge || "—"}</td>
                        <td>{row.maximumAge || "—"}</td>
                        <td>{row.relaxation || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function JobQualificationSection({ panels }: { panels: JobInfoPanel[] }) {
  const visiblePanels = panels
    .map((panel, index) => ({ panel, index }))
    .filter(({ panel }) => panel.qualification.trim());

  if (visiblePanels.length === 0) return null;

  return (
    <section className="post-detail-section" id="educational-qualification">
      <SectionHeader title="Educational Qualification" />

      <div className="job-detail-stack-list compact">
        {visiblePanels.map(({ panel, index }) => (
          <div className="job-detail-text-block" key={panel.id}>
            <h3>{getPanelTitle(panel, index)}</h3>
            <p>{panel.qualification}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function JobFeeStructureSection({ rows }: { rows: JobFeeRow[] }) {
  const visibleRows = rows.filter((row) => row.fee.trim());

  if (visibleRows.length === 0) return null;

  return (
    <section className="post-detail-section" id="fee-structure">
      <SectionHeader title="Fee Structure" />

      <div className="job-detail-table-scroll standalone-table">
        <table className="job-detail-data-table fee-table">
          <thead>
            <tr>
              <th>Post / Vacancy</th>
              <th>Applicant Category</th>
              <th>Fee</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.postName || "All Posts"}</th>
                <td>{row.category || "All Categories"}</td>
                <td>
                  <strong>{row.fee}</strong>
                </td>
                <td>{row.remarks || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function JobDocumentsSection({
  documents,
}: {
  documents: RequiredDocumentRow[];
}) {
  const visibleDocuments = documents.filter(
    (item) => item.required && item.name.trim()
  );

  if (visibleDocuments.length === 0) return null;

  return (
    <section className="post-detail-section" id="documents-required">
      <SectionHeader title="Documents Required" />

      <ul className="job-detail-document-list common-documents">
        {visibleDocuments.map((document) => (
          <li key={document.id}>{document.name}</li>
        ))}
      </ul>
    </section>
  );
}

function VideoGuideSection({
  videos,
  title,
}: {
  videos: VideoRow[];
  title: string;
}) {
  if (videos.length === 0) {
    return null;
  }

  return (
    <section className="post-detail-section" id="video-guide">
      <SectionHeader title="Video Guide" />

      <div className="video-guide-list">
        {videos.map((video, index) => {
          const videoId = getYouTubeId(video.url);
          const videoUrl = video.url || "";

          return (
            <div className="video-guide-card" key={`${videoUrl}-${index}`}>
              <div className="video-frame">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={video.title || `${title} Video ${index + 1}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="video-guide-footer">
                <strong>{video.title || `Video Guide ${index + 1}`}</strong>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `${title}\n${videoUrl}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Share
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" role="img" focusable="false">
      <path d="M16.04 3C9.42 3 4.03 8.35 4.03 14.94c0 2.1.55 4.16 1.6 5.97L4 27l6.27-1.62a12.1 12.1 0 0 0 5.77 1.47C22.66 26.85 28 21.5 28 14.94 28 8.35 22.66 3 16.04 3Zm0 21.83a10.1 10.1 0 0 1-5.15-1.4l-.37-.22-3.72.96.99-3.6-.24-.38a9.8 9.8 0 0 1-1.5-5.25c0-5.47 4.49-9.92 10-9.92 5.5 0 9.97 4.45 9.97 9.92 0 5.47-4.47 9.89-9.98 9.89Zm5.48-7.42c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.29-.77.96-.95 1.15-.17.2-.35.22-.65.07-.3-.14-1.26-.46-2.4-1.48-.89-.79-1.49-1.76-1.66-2.06-.17-.29-.02-.45.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.57-.49-.5-.67-.5h-.57c-.2 0-.52.08-.8.37-.27.3-1.04 1.01-1.04 2.47s1.07 2.87 1.22 3.07c.15.2 2.1 3.18 5.1 4.46.71.3 1.27.49 1.7.63.72.23 1.37.2 1.89.12.58-.09 1.77-.72 2.02-1.41.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 32 32" role="img" focusable="false">
      <path d="M27.63 6.43c.31-1.43-.74-2-1.9-1.54L4.58 13.05c-1.44.56-1.42 1.35-.25 1.71l5.43 1.7 12.58-7.93c.6-.36 1.14-.17.7.22l-10.19 9.2-.39 5.77c.57 0 .82-.26 1.14-.57l2.74-2.66 5.7 4.21c1.05.58 1.8.28 2.06-.97l3.53-17.3Z" />
    </svg>
  );
}

function CopyLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" focusable="false">
      <path d="M10.6 13.4a1 1 0 0 0 1.4 0l3.4-3.4a3 3 0 1 0-4.2-4.2L9.8 7.2a1 1 0 1 0 1.4 1.4l1.4-1.4a1 1 0 1 1 1.4 1.4L10.6 12a1 1 0 0 0 0 1.4Zm2.8-2.8a1 1 0 0 0-1.4 0L8.6 14a1 1 0 1 1-1.4-1.4l1.4-1.4a1 1 0 1 0-1.4-1.4l-1.4 1.4A3 3 0 1 0 10 15.4l3.4-3.4a1 1 0 0 0 0-1.4Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 32 32" role="img" focusable="false">
      <path d="M19.1 17.9h3.28l.52-4.02h-3.8v-2.2c0-1.06.34-1.78 1.9-1.78h2.02V6.3c-.35-.05-1.55-.15-2.95-.15-2.92 0-4.92 1.78-4.92 5.05v2.68h-3.3v4.02h3.3v10h3.95v-10Z" />
    </svg>
  );
}

function MoreShareIcon() {
  return (
    <svg viewBox="0 0 24 24" role="img" focusable="false">
      <path d="M18 16a3 3 0 0 0-2.39 1.2l-6.7-3.35a3.2 3.2 0 0 0 0-1.7l6.7-3.35A3 3 0 1 0 15 7a2.7 2.7 0 0 0 .09.7L8.4 11.05a3 3 0 1 0 0 3.9l6.69 3.35A2.7 2.7 0 0 0 15 19a3 3 0 1 0 3-3Z" />
    </svg>
  );
}
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="post-detail-section-header">
      <h2>{title}</h2>
    </div>
  );
}

function PostDetailStyles() {
  return (
    <style>{`
      .post-detail-page {
        background: #f5f7fb;
        min-height: 100vh;
        padding: 18px 0 40px;
      }

      .post-detail-container {
        width: min(1180px, calc(100% - 24px));
        margin: 0 auto;
      }

      .post-detail-breadcrumb {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
        color: #64748b;
        font-size: 14px;
        line-height: 1.5;
      }

      .post-detail-breadcrumb a,
      .post-detail-back-link {
        color: #0b63ce;
        text-decoration: none;
        font-weight: 800;
      }

      .post-detail-breadcrumb a:hover,
      .post-detail-back-link:hover {
        color: #e85d04;
      }

      .post-detail-back-link {
        display: inline-flex;
        margin-bottom: 14px;
      }

      .post-detail-shell {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        box-shadow: 0 12px 34px rgba(15, 23, 42, 0.08);
        overflow: hidden;
      }

      .post-detail-header {
        padding: 20px 20px 18px;
        border-bottom: 1px solid #eef2f7;
        background: linear-gradient(180deg, #ffffff, #f8fafc);
      }

      .post-detail-badge-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin: 12px 0 0;
      }

      .post-detail-category-badge,
      .post-detail-status-badge {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 5px 12px;
        border-radius: 999px;
        font-weight: 900;
        font-size: 13px;
      }

      .post-detail-category-badge {
        background: #e0f2fe;
        color: #075985;
      }

      .post-detail-status-badge.success {
        background: #dcfce7;
        color: #166534;
      }

      .post-detail-status-badge.danger {
        background: #fee2e2;
        color: #991b1b;
      }

      .post-detail-status-badge.warning {
        background: #ffedd5;
        color: #9a3412;
      }

      .post-detail-status-badge.info {
        background: #dbeafe;
        color: #1d4ed8;
      }

      .post-detail-header h1 {
        margin: 0;
        color: #0f172a;
        font-size: clamp(25px, 3.8vw, 40px);
        line-height: 1.18;
        font-weight: 950;
        letter-spacing: -0.03em;
      }

      .post-detail-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }

      .post-detail-chip {
        padding: 6px 10px;
        background: #eff6ff;
        color: #1d4ed8;
        border-radius: 999px;
        font-size: 13px;
        font-weight: 800;
        border: 1px solid #bfdbfe;
      }

      .post-detail-short-description {
        margin: 12px 0 0;
        color: #475569;
        font-size: 16px;
        line-height: 1.65;
      }

      .post-detail-notification-number {
        margin: 10px 0 0;
        color: #166534;
        font-size: 15px;
        line-height: 1.5;
        font-weight: 850;
      }

      .post-detail-notification-number strong {
        font-weight: 950;
      }

      .post-detail-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 330px;
        gap: 20px;
        align-items: start;
        padding: 18px;
      }

      .post-detail-main {
        min-width: 0;
      }

      .post-detail-image-box,
      .default-post-banner {
        width: 100%;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        background: #f8fafc;
        margin-bottom: 22px;
      }

      .post-detail-image-box img {
        width: 100%;
        height: auto;
        object-fit: contain;
        display: block;
      }

      .post-detail-image-box.youtube-banner {
        position: relative;
        display: block;
        text-decoration: none;
        background: #0f172a;
      }

      .post-detail-image-box.youtube-banner span {
        position: absolute;
        left: 50%;
        bottom: 16px;
        transform: translateX(-50%);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 38px;
        padding: 8px 15px;
        border-radius: 999px;
        background: rgba(220, 38, 38, 0.94);
        color: #ffffff;
        font-size: 13px;
        font-weight: 950;
        box-shadow: 0 8px 20px rgba(15, 23, 42, 0.22);
      }

      .default-post-banner {
        position: relative;
        min-height: 315px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 26px;
        box-shadow: inset 0 0 0 1px #f1f5f9;
      }

      .default-post-banner::before {
        content: "";
        position: absolute;
        inset: 18px;
        border: 2px dashed #dbeafe;
        border-radius: 16px;
        pointer-events: none;
      }

      .default-banner-logo {
  position: absolute;
  top: 24px;
  left: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.default-banner-logo img {
  width: 58px;
  height: 58px;
  object-fit: contain;
  display: block;
}      

.default-banner-content {
        position: relative;
        z-index: 1;
        text-align: center;
        max-width: 820px;
        padding-top: 34px;
      }

      .default-banner-kicker {
        margin: 0 0 10px;
        color: #0b63ce;
        font-size: clamp(18px, 3vw, 30px);
        font-weight: 950;
      }

      .default-banner-content h2 {
        margin: 0;
        color: #e85d04;
        font-size: clamp(20px, 3vw, 34px);
        line-height: 1.2;
        font-weight: 950;
      }

      .default-banner-content h3 {
        margin: 10px 0 18px;
        color: #166534;
        font-size: clamp(18px, 2.6vw, 28px);
        line-height: 1.25;
        font-weight: 950;
      }

      .default-banner-tags {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 9px;
      }

      .default-banner-tags span {
        padding: 8px 11px;
        border-radius: 999px;
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        font-size: 13px;
        font-weight: 900;
      }

      .default-banner-tags span:nth-child(1) {
        color: #1d4ed8;
      }

      .default-banner-tags span:nth-child(2) {
        color: #16a34a;
      }

      .default-banner-tags span:nth-child(3) {
        color: #db2777;
      }

      .default-banner-tags span:nth-child(4) {
        color: #dc2626;
      }

      .default-banner-tags span:nth-child(5) {
        color: #7c3aed;
      }

      .post-detail-page {
        scroll-behavior: smooth;
      }

      .post-detail-section,
      .post-detail-share-section {
        scroll-margin-top: 96px;
      }

      .post-detail-toc {
        margin-bottom: 22px;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        background: #ffffff;
        overflow: hidden;
      }

      .post-detail-toc-title {
        padding: 13px 15px;
        background: #f8fafc;
        border-bottom: 1px solid #e5e7eb;
        color: #111827;
        font-size: 18px;
        font-weight: 950;
      }

      .post-detail-toc-list {
        display: flex;
        flex-wrap: wrap;
        gap: 9px;
        padding: 14px;
      }

      .post-detail-toc-list a {
        display: inline-flex;
        align-items: center;
        min-height: 34px;
        padding: 7px 11px;
        border: 1px solid #bfdbfe;
        border-radius: 999px;
        background: #eff6ff;
        color: #1d4ed8;
        text-decoration: none;
        font-size: 13px;
        font-weight: 900;
      }

      .post-detail-toc-list a:hover {
        border-color: #fdba74;
        background: #fff7ed;
        color: #e85d04;
      }

      .post-detail-section {
        margin-top: 22px;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        background: #ffffff;
        overflow: hidden;
      }

      .post-detail-section:first-of-type {
        margin-top: 0;
      }

      .post-detail-section-header {
        padding: 13px 15px;
        background: #f8fafc;
        border-bottom: 1px solid #e5e7eb;
      }

      .post-detail-section-header h2 {
        margin: 0;
        font-size: 18px;
        color: #111827;
        font-weight: 950;
      }

      .post-detail-description {
        padding: 15px;
        color: #334155;
        font-size: 15.5px;
        line-height: 1.8;
        white-space: pre-line;
      }

      .post-detail-description.muted {
        color: #64748b;
      }

      .post-detail-info-table {
        display: grid;
      }

      .post-detail-info-table div {
        display: grid;
        grid-template-columns: minmax(150px, 38%) 1fr;
        border-bottom: 1px solid #e5e7eb;
      }

      .post-detail-info-table div:last-child {
        border-bottom: 0;
      }

      .post-detail-info-table span,
      .post-detail-info-table strong {
        padding: 13px 15px;
        font-size: 15px;
        line-height: 1.5;
      }

      .post-detail-info-table span {
        color: #0f172a;
        font-weight: 850;
        background: #fdfdfd;
        border-right: 1px solid #e5e7eb;
      }

      .post-detail-info-table strong {
        color: #334155;
        font-weight: 650;
      }

      .job-detail-stack-list {
        display: grid;
        gap: 14px;
        padding: 14px;
      }

      .job-detail-stack-list.compact {
        gap: 10px;
      }

      .job-detail-data-block,
      .job-detail-text-block {
        border: 1px solid #e2e8f0;
        border-radius: 13px;
        background: #ffffff;
        overflow: hidden;
      }

      .job-detail-data-block > h3,
      .job-detail-text-block > h3 {
        margin: 0;
        padding: 11px 13px;
        border-bottom: 1px solid #e2e8f0;
        background: #f8fafc;
        color: #0f172a;
        font-size: 15px;
        line-height: 1.35;
        font-weight: 950;
      }

      .job-detail-table-scroll {
        width: 100%;
        overflow-x: auto;
      }

      .job-detail-table-scroll.standalone-table {
        box-sizing: border-box;
        padding: 14px;
      }

      .standalone-table .job-detail-data-table {
        border: 1px solid #e2e8f0;
      }

      .fee-table td:nth-child(3) strong {
        color: #166534;
        font-weight: 950;
      }

      .job-detail-data-table {
        width: 100%;
        min-width: 560px;
        border-collapse: collapse;
      }

      .job-detail-data-table th,
      .job-detail-data-table td {
        padding: 10px 12px;
        border-right: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0;
        color: #334155;
        font-size: 13.5px;
        line-height: 1.4;
        text-align: center;
      }

      .job-detail-data-table tr:last-child th,
      .job-detail-data-table tr:last-child td {
        border-bottom: 0;
      }

      .job-detail-data-table th:last-child,
      .job-detail-data-table td:last-child {
        border-right: 0;
      }

      .job-detail-data-table thead th {
        background: #eff6ff;
        color: #1e3a8a;
        font-weight: 950;
      }

      .job-detail-data-table tbody th {
        background: #f8fafc;
        color: #0f172a;
        font-weight: 900;
        text-align: left;
      }

      .job-detail-total-vacancy {
        margin: 0;
        padding: 12px 13px;
        border-top: 1px solid #e2e8f0;
        background: #f0fdf4;
        color: #166534;
        font-size: 15px;
        font-weight: 900;
      }

      .job-detail-total-vacancy strong {
        font-weight: 950;
      }

      .job-detail-summary-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        padding: 12px;
      }

      .job-detail-summary-grid > div {
        display: grid;
        gap: 4px;
        padding: 10px 11px;
        border: 1px solid #dbeafe;
        border-radius: 10px;
        background: #eff6ff;
      }

      .job-detail-summary-grid span {
        color: #475569;
        font-size: 12px;
        font-weight: 850;
      }

      .job-detail-summary-grid strong {
        color: #0f172a;
        font-size: 14px;
        font-weight: 950;
      }

      .job-detail-text-block p {
        margin: 0;
        padding: 12px 13px;
        color: #334155;
        font-size: 14.5px;
        line-height: 1.7;
        white-space: pre-line;
      }

      .job-detail-document-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin: 0;
        padding: 12px 13px;
        list-style: none;
      }

      .job-detail-document-list li {
        position: relative;
        padding: 9px 10px 9px 34px;
        border: 1px solid #e2e8f0;
        border-radius: 9px;
        background: #f8fafc;
        color: #334155;
        font-size: 13px;
        font-weight: 800;
      }

      .job-detail-document-list li::before {
        content: "✓";
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: #16a34a;
        font-weight: 950;
      }

      .post-detail-date-list {
        display: grid;
        gap: 10px;
        padding: 14px;
      }

      .post-detail-date-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        align-items: center;
        padding: 13px 14px;
        border-radius: 13px;
        border: 1px solid #e5e7eb;
        border-left: 5px solid #94a3b8;
        background: #f8fafc;
      }

      .post-detail-date-row span {
        color: #475569;
        font-weight: 850;
      }

      .post-detail-date-row strong {
        color: #0f172a;
        font-weight: 900;
        text-align: right;
      }

      .post-detail-date-row.success {
        border-left-color: #16a34a;
        background: #f0fdf4;
      }

      .post-detail-date-row.danger {
        border-left-color: #dc2626;
        background: #fef2f2;
      }

      .post-detail-date-row.info {
        border-left-color: #2563eb;
        background: #eff6ff;
      }

      .post-detail-link-list {
        display: grid;
        gap: 10px;
        padding: 14px;
      }

      .post-detail-link-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        text-decoration: none;
        background: #f8fafc;
        border: 1px solid #e5e7eb;
        border-radius: 13px;
        padding: 13px 14px;
        color: #0b63ce;
        font-weight: 900;
        transition: 0.18s ease;
      }

      .post-detail-link-row strong {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 34px;
        padding: 7px 12px;
        border-radius: 999px;
        background: #0b63ce;
        color: #ffffff;
        font-size: 13px;
        white-space: nowrap;
      }

      .post-detail-link-row:hover {
        color: #e85d04;
        border-color: #fdba74;
        background: #fff7ed;
      }

      .post-detail-link-row:hover strong {
        background: #e85d04;
      }

      .post-detail-empty-text {
        margin: 0;
        padding: 15px;
        color: #64748b;
        font-size: 15px;
      }

      .video-guide-list {
        display: grid;
        gap: 16px;
        padding: 14px;
      }

      .video-guide-card {
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        overflow: hidden;
        background: #ffffff;
      }

      .video-frame {
        position: relative;
        width: 100%;
        padding-top: 56.25%;
        background: #0f172a;
      }

      .video-frame iframe {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        border: 0;
      }

      .video-guide-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
      }

      .video-guide-footer strong {
        color: #0f172a;
        font-size: 15px;
      }

      .video-guide-footer a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 34px;
        padding: 7px 13px;
        border-radius: 999px;
        color: #ffffff;
        background: #25d366;
        text-decoration: none;
        font-size: 13px;
        font-weight: 900;
      }

      .video-guide-footer a:hover {
        background: #128c7e;
      }

      .post-detail-share-section {
        margin-top: 22px;
        padding: 16px;
        border-radius: 18px;
        background: linear-gradient(135deg, #f0fdf4, #eff6ff);
        border: 1px solid #dbeafe;
      }

      .post-detail-share-section p {
        margin: 0 0 13px;
        color: #0f172a;
        font-size: 17px;
        font-weight: 950;
      }

      .post-detail-share-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }

      .share-pointer {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        color: #e85d04;
        font-size: 28px;
        font-weight: 950;
        animation: pointShare 0.9s ease-in-out infinite alternate;
      }

      @keyframes pointShare {
        from {
          transform: translateX(0);
        }
        to {
          transform: translateX(8px);
        }
      }

      .share-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-height: 42px;
        padding: 9px 15px;
        border-radius: 999px;
        color: #ffffff;
        text-decoration: none;
        font-weight: 950;
      }

      .share-btn.whatsapp {
        background: #25d366;
      }

      .share-btn.telegram {
        background: #229ed9;
      }

      .share-btn.facebook {
        background: #1877f2;
      }

      .share-btn.copy-link {
        border: 0;
        background: #334155;
        cursor: pointer;
        font: inherit;
      }

      .share-btn.more-share {
        border: 0;
        background: #7c3aed;
        cursor: pointer;
        font: inherit;
      }

      .share-btn.whatsapp:hover {
        background: #128c7e;
      }

      .share-btn.telegram:hover {
        background: #0f82b8;
      }

      .share-btn.facebook:hover {
        background: #0f5fc7;
      }

      .share-btn.copy-link:hover {
        background: #1e293b;
      }

      .share-btn.more-share:hover {
        background: #6d28d9;
      }

      .share-btn.copy-link:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .share-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 27px;
  height: 27px;
  border-radius: 50%;
  background: #ffffff;
  flex: 0 0 27px;
}

.share-icon svg {
  width: 18px;
  height: 18px;
  display: block;
  fill: currentColor;
}

.share-btn.whatsapp .share-icon {
  color: #25d366;
}

.share-btn.telegram .share-icon {
  color: #229ed9;
}

.share-btn.facebook .share-icon {
  color: #1877f2;
}

.share-btn.copy-link .share-icon {
  color: #334155;
}

.share-btn.more-share .share-icon {
  color: #7c3aed;
}

      .post-detail-sidebar {
        display: grid;
        gap: 16px;
        position: sticky;
        top: 84px;
      }

      .post-detail-side-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
        padding: 16px;
      }

      .side-card-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }

      .post-detail-side-card h3,
      .side-card-title-row h3 {
        margin: 0;
        color: #0f172a;
        font-size: 18px;
        font-weight: 950;
      }

      .side-card-title-row a {
        color: #0b63ce;
        text-decoration: none;
        font-size: 13px;
        font-weight: 950;
        white-space: nowrap;
      }

      .side-card-title-row a:hover {
        color: #e85d04;
      }

      .post-detail-side-muted {
        margin: 0;
        color: #64748b;
        line-height: 1.6;
        font-size: 14px;
      }

      .post-detail-related-list,
      .post-detail-quick-access {
        display: grid;
        gap: 9px;
      }

      .post-detail-related-list a,
      .post-detail-quick-access a {
        color: #0b63ce;
        text-decoration: none;
        font-weight: 850;
        line-height: 1.45;
        padding-bottom: 9px;
        border-bottom: 1px dashed #e5e7eb;
      }

      .post-detail-related-list a:hover,
      .post-detail-quick-access a:hover {
        color: #e85d04;
      }

      .post-detail-related-list a:last-child,
      .post-detail-quick-access a:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }

      @media (max-width: 900px) {
        .post-detail-page {
          padding-top: 12px;
        }

        .post-detail-grid {
          grid-template-columns: 1fr;
          padding: 14px;
        }

        .post-detail-sidebar {
          position: static;
        }

        .post-detail-header {
          padding: 16px;
        }

        .post-detail-shell {
          border-radius: 16px;
        }

        .post-detail-image-box,
        .default-post-banner,
        .post-detail-section,
        .post-detail-side-card {
          border-radius: 14px;
        }

        .post-detail-date-row {
          grid-template-columns: 1fr;
          align-items: start;
        }

        .post-detail-date-row strong {
          text-align: left;
        }

        .post-detail-link-row,
        .video-guide-footer {
          align-items: flex-start;
          flex-direction: column;
        }

        .post-detail-info-table div {
          grid-template-columns: 1fr;
        }

        .post-detail-info-table span {
          border-right: 0;
          border-bottom: 1px solid #eef2f7;
        }

        .job-detail-data-table {
          min-width: 620px;
        }
      }

      @media (max-width: 520px) {
        .post-detail-container {
          width: min(100% - 18px, 1180px);
        }

        .post-detail-header h1 {
          font-size: 25px;
        }

        .post-detail-short-description {
          font-size: 15px;
        }

        .post-detail-grid {
          gap: 16px;
          padding: 12px;
        }

        .post-detail-date-list,
        .post-detail-link-list,
        .video-guide-list {
          padding: 12px;
        }

        .post-detail-description {
          font-size: 15px;
          padding: 13px;
        }

        .job-detail-stack-list {
          padding: 10px;
        }

        .job-detail-summary-grid,
        .job-detail-document-list {
          grid-template-columns: 1fr;
          padding: 10px;
        }

        .job-detail-data-block > h3,
        .job-detail-text-block > h3 {
          padding: 10px 11px;
          font-size: 14px;
        }

        .job-detail-text-block p,
        .job-detail-total-vacancy {
          padding: 10px 11px;
        }

        .post-detail-link-row strong,
        .video-guide-footer a,
        .share-btn {
          width: 100%;
        }

        .default-post-banner {
          min-height: 340px;
          padding: 22px;
        }

        .default-banner-logo {
          top: 22px;
          left: 22px;
        }

.default-banner-logo {
  top: 22px;
  left: 22px;
}

.default-banner-logo img {
  width: 50px;
  height: 50px;
}

        .default-banner-content {
          padding-top: 44px;
        }
      }
    `}</style>
  );
}
