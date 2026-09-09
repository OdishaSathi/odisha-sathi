import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { dbServer } from "@/lib/firebaseServer";
import {
  cleanImportantInfoPost,
  getImportantInfoDisplayImage,
  getImportantInfoOgImage,
  getImportantInfoYouTubeId,
  type ImportantInfoPost,
} from "@/lib/importantInformation";
import { isPublicDetailPost } from "@/lib/publicPostQuality";
import SocialShareButtons from "@/components/public/SocialShareButtons";
import { getPublicLinkAction } from "@/lib/publicLinkLabels";
import { toImportantImageProxyUrl } from "@/lib/publicImageUrl";

type ImportantInfoPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type RelatedPost = {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  href: string;
};

function cleanText(value: any, maxLength = 160) {
  const text = String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

function normalizeText(value?: string) {
  return String(value || "").trim().toLowerCase();
}

function getPostHref(post: any, id: string) {
  const slug = post.slug || id;
  return `/post/${slug}`;
}



async function getImportantInfoBySlug(slug: string): Promise<ImportantInfoPost | null> {
  const pageSlug = decodeURIComponent(slug);

  try {
    const slugQuery = query(
      collection(dbServer, "importantInformation"),
      where("slug", "==", pageSlug),
      limit(1)
    );
    const slugSnapshot = await getDocs(slugQuery);

    if (!slugSnapshot.empty) {
      const item = slugSnapshot.docs[0];
      const post = cleanImportantInfoPost(item.data(), item.id);
      return post.status === "hidden" ? null : post;
    }

    const directDoc = await getDoc(doc(dbServer, "importantInformation", pageSlug));

    if (directDoc.exists()) {
      const post = cleanImportantInfoPost(directDoc.data(), directDoc.id);
      return post.status === "hidden" ? null : post;
    }

    return null;
  } catch (error) {
    console.error("Important information fetch failed:", error);
    return null;
  }
}

async function getRelatedPosts(keywords: string[]) {
  const cleanKeywords = keywords.map((item) => normalizeText(item)).filter(Boolean);

  if (cleanKeywords.length === 0) return [];

  try {
    const snapshot = await getDocs(collection(dbServer, "posts"));
    const related: RelatedPost[] = [];

    snapshot.docs.forEach((docItem) => {
      const data = docItem.data();
      const category = normalizeText(data.category);

      if (
        !category ||
        category === "tools" ||
        !isPublicDetailPost(data, docItem.id)
      ) {
        return;
      }

      const searchText = normalizeText([
        data.title,
        data.description,
        data.content,
        data.department,
        data.organization,
        data.schemeName,
        data.examName,
        data.subCategory,
        Array.isArray(data.subCategories) ? data.subCategories.join(" ") : "",
      ].join(" "));

      const matched = cleanKeywords.some((keyword) => searchText.includes(keyword));

      if (!matched) return;

      related.push({
        id: docItem.id,
        title: data.title || data.schemeName || "Odisha Sathi Update",
        slug: data.slug || docItem.id,
        category: data.category || "jobs",
        href: getPostHref(data, docItem.id),
      });
    });

    return related.slice(0, 8);
  } catch (error) {
    console.error("Related posts fetch failed:", error);
    return [];
  }
}

export async function generateMetadata({ params }: ImportantInfoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getImportantInfoBySlug(slug);

  const title = cleanText(post?.shareTitle || post?.title || "Important Information - Odisha Sathi", 90);
  const description = cleanText(
    post?.shareDescription || post?.shortDescription || post?.details || "Important information from Odisha Sathi.",
    160
  );
  const imageUrl = getImportantInfoOgImage(post);
  const canonicalSlug = post?.slug || post?.id || decodeURIComponent(slug);
  const canonicalUrl = `/important-information/${encodeURIComponent(canonicalSlug)}`;

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

export default async function ImportantInformationDetailPage({ params }: ImportantInfoPageProps) {
  const { slug } = await params;
  const post = await getImportantInfoBySlug(slug);

  if (!post) {
    notFound();
  }

  const requestedSlug = decodeURIComponent(slug).trim();
  const canonicalSlug = String(post.slug || post.id || requestedSlug).trim();
  if (canonicalSlug && canonicalSlug !== requestedSlug) {
    redirect(`/important-information/${encodeURIComponent(canonicalSlug)}`);
  }

  const detailSections = (post.detailSections || []).filter((section) => {
    const hasContent = Boolean(String(section.content || "").trim());
    const hasImages = (section.imageUrls || []).some((url) =>
      Boolean(String(url || "").trim())
    );
    return hasContent || hasImages;
  });
  const dataTables = (post.dataTables || []).filter((table) => {
    const hasImage = Boolean(String(table.imageUrl || "").trim());
    const hasNote = Boolean(String(table.note || "").trim());
    const hasRows = (table.rows || []).some((row) =>
      (row.cells || []).some((cell) => Boolean(String(cell || "").trim()))
    );
    return hasImage || hasNote || hasRows;
  });
  const importantDates = (post.importantDates || []).filter((row) =>
    Boolean(String(row.value || "").trim())
  );
  const importantLinks = (post.importantLinks || []).filter((row) =>
    Boolean(String(row.url || "").trim())
  );

  const relatedPosts = await getRelatedPosts(post.referenceKeywords || []);
  const videos = [post.youtubeUrl, ...(post.youtubeUrls || [])]
    .map((item) => String(item || "").trim())
    .filter((item) => item && getImportantInfoYouTubeId(item));
  const shareTitle = post.shareTitle || post.title;
  const shareDescription = post.shareDescription || post.shortDescription || "";
  const shareUrl = `https://odishasathi.in/important-information/${post.slug || post.id}`;
  const previewImageUrl = getImportantInfoDisplayImage(post);
  const proxiedPreviewImageUrl = toImportantImageProxyUrl(previewImageUrl);
  return (
    <main className="important-detail-page">
      <div className="important-detail-container">
        <div className="important-breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>Important Information</span>
          <span>/</span>
          <span>{post.title}</span>
        </div>

        <Link href="/" className="important-back-link">← Back</Link>

        <article className="important-detail-shell">
          <header className="important-detail-header">
            <span>Important Information</span>
            <h1>{post.title}</h1>
            {post.shortDescription ? <p>{post.shortDescription}</p> : null}
          </header>

          <div className="important-detail-grid">
            <section className="important-main-column">
              {previewImageUrl ? (
                <div className="important-title-image">
                  <img src={proxiedPreviewImageUrl || previewImageUrl} alt={`${post.title} preview`} />
                </div>
              ) : null}

              {post.notificationNumber?.trim() ? (
                <p className="important-notification-number">
                  Notification / Reference No.:{" "}
                  <strong>{post.notificationNumber.trim()}</strong>
                </p>
              ) : null}

              {post.details?.trim() ? (
                <section className="important-section">
                  <SectionHeader title="Main Content" />
                  <div className="important-description">{post.details}</div>
                </section>
              ) : null}

              {detailSections.map((section, index) => (
                <section className="important-section" key={`${section.id || section.title}-${index}`}>
                  {section.title?.trim() ? <SectionHeader title={section.title.trim()} /> : null}
                  {(section.imageUrls || []).length > 0 ? (
                    <div className="important-image-grid">
                      {(section.imageUrls || []).map((imageUrl, imageIndex) => (
                        <img
                          key={`${imageUrl}-${imageIndex}`}
                          src={toImportantImageProxyUrl(imageUrl) || imageUrl}
                          alt={`${section.title || post.title} image ${imageIndex + 1}`}
                        />
                      ))}
                    </div>
                  ) : null}
                  {section.content ? (
                    <div className="important-description">{section.content}</div>
                  ) : null}
                </section>
              ))}

              {dataTables.map((table, tableIndex) => {
                const columns = (table.columns || []).map((column) => String(column || "").trim());
                const showHeader = columns.some(Boolean);
                const visibleRows = (table.rows || []).filter((row) =>
                  (row.cells || []).some((cell) => Boolean(String(cell || "").trim()))
                );
                const note = String(table.note || "").trim();
                const title = String(table.title || "").trim();
                return (
                  <section
                    className="important-section"
                    key={table.id || tableIndex}
                  >
                    {title ? <SectionHeader title={title} /> : null}
                    {table.imageUrl ? (
                      <div className="important-image-grid">
                        <img
                          src={toImportantImageProxyUrl(table.imageUrl) || table.imageUrl}
                          alt={`${title || post.title} reference`}
                        />
                      </div>
                    ) : null}
                    {visibleRows.length > 0 ? (
                      <div className="important-table-scroll">
                        <table className="important-data-table">
                          {showHeader ? (
                            <thead>
                              <tr>
                                {columns.map((column, columnIndex) => (
                                  <th key={columnIndex}>{column}</th>
                                ))}
                              </tr>
                            </thead>
                          ) : null}
                          <tbody>
                            {visibleRows.map((row) => (
                              <tr key={row.id}>
                                {columns.map((_, cellIndex) => (
                                  <td key={cellIndex}>{String(row.cells[cellIndex] || "").trim()}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                    {note ? <div className="important-table-note">{note}</div> : null}
                  </section>
                );
              })}

              {importantDates.length > 0 ? (
                <section className="important-section">
                  <SectionHeader title="Important Dates" />
                  <div className="important-simple-rows">
                    {importantDates.map((row, index) => (
                      <div key={row.id || index}>
                        <span>{row.label || row.type || "Date"}</span>
                        <strong>{row.value}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {importantLinks.length > 0 ? (
                <section className="important-section">
                  <SectionHeader title="Important Links" />
                  <div className="important-link-rows">
                    {importantLinks.map((row, index) => (
                      <a
                        key={row.id || index}
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span>{row.label || row.type || "Official Link"}</span>
                        <strong>{getPublicLinkAction(row)}</strong>
                      </a>
                    ))}
                  </div>
                </section>
              ) : null}

              {videos.length > 0 ? (
                <section className="important-section">
                  <SectionHeader title="Video Guide" />
                  <div className="important-video-list">
                    {videos.map((videoUrl, index) => (
                      <div className="important-video-card" key={`${videoUrl}-${index}`}>
                        <div className="important-video-frame">
                          <iframe
                            src={`https://www.youtube.com/embed/${getImportantInfoYouTubeId(videoUrl)}`}
                            title={`${post.title} Video Guide ${index + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <div className="important-video-footer">
                          <strong>Video Guide {index + 1}</strong>
                          <a href={`https://wa.me/?text=${encodeURIComponent(`${post.title}\n${videoUrl}`)}`} target="_blank" rel="noopener noreferrer">Share</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="important-share-section">
                <p>Share this information</p>
                <SocialShareButtons
                  title={shareTitle}
                  description={shareDescription}
                  postUrl={shareUrl}
                />
              </section>
            </section>

            <aside className="important-side-column">
              {post.quickInfoRows && post.quickInfoRows.length > 0 ? (
                <div className="important-side-card">
                  <h3>Quick Panel</h3>
                  <div className="important-quick-list">
                    {post.quickInfoRows.map((row, index) => (
                      <div key={`${row.label}-${index}`}>
                        <span>{row.label}</span>
                        <strong>{row.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {relatedPosts.length > 0 ? (
                <div className="important-side-card">
                  <div className="important-side-title-row">
                    <h3>Relevant Posts</h3>
                  </div>
                  <div className="important-related-list">
                    {relatedPosts.map((item) => (
                      <Link key={item.id} href={item.href}>{item.title}</Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="important-side-card">
                <h3>Quick Access</h3>
                <div className="important-related-list">
                  <Link href="/jobs">Latest Jobs</Link>
                  <Link href="/admit-cards">Admit Cards & Exams</Link>
                  <Link href="/results">Results</Link>
                  <Link href="/admissions">Admissions</Link>
                  <Link href="/citizen-services">Citizen Services</Link>
                </div>
              </div>
            </aside>
          </div>
        </article>
      </div>
      <ImportantDetailStyles />
    </main>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="important-section-header">
      <h2>{title}</h2>
    </div>
  );
}

function ImportantDetailStyles() {
  return (
    <style>{`
      .important-detail-page {
        background: #f5f7fb;
        min-height: 100vh;
        padding: 18px 0 40px;
        color: #0f172a;
      }

      .important-detail-container {
        width: min(1180px, calc(100% - 24px));
        margin: 0 auto;
      }

      .important-breadcrumb {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
        color: #64748b;
        font-size: 14px;
      }

      .important-breadcrumb a,
      .important-back-link {
        color: #0b63ce;
        text-decoration: none;
        font-weight: 800;
      }

      .important-breadcrumb a:hover,
      .important-back-link:hover {
        color: #e85d04;
      }

      .important-back-link {
        display: inline-flex;
        margin-bottom: 14px;
      }

      .important-empty-card,
      .important-detail-shell {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        box-shadow: 0 12px 34px rgba(15, 23, 42, 0.08);
        overflow: hidden;
      }

      .important-empty-card {
        padding: 24px;
      }

      .important-detail-header {
        padding: 20px;
        border-bottom: 1px solid #eef2f7;
        background: linear-gradient(180deg, #ffffff, #f8fafc);
      }

      .important-detail-header span {
        display: inline-flex;
        margin-bottom: 10px;
        padding: 6px 12px;
        border-radius: 999px;
        background: #fff7ed;
        color: #ea580c;
        font-size: 13px;
        font-weight: 950;
      }

      .important-detail-header h1 {
        margin: 0;
        font-size: clamp(25px, 3.8vw, 40px);
        line-height: 1.18;
        letter-spacing: -0.03em;
        font-weight: 950;
      }

      .important-detail-header p {
        margin: 12px 0 0;
        color: #475569;
        font-size: 16px;
        line-height: 1.65;
      }

      .important-detail-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 330px;
        gap: 20px;
        align-items: start;
        padding: 18px;
      }

      .important-main-column {
        min-width: 0;
      }

      .important-side-column {
        display: grid;
        gap: 16px;
        position: sticky;
        top: 84px;
      }

      .important-section,
      .important-side-card {
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        background: #ffffff;
        overflow: hidden;
        margin-bottom: 22px;
      }

      .important-side-card {
        margin-bottom: 0;
        padding: 16px;
        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
      }

      .important-section-header {
        padding: 13px 15px;
        background: #f8fafc;
        border-bottom: 1px solid #e5e7eb;
      }

      .important-section-header h2,
      .important-side-card h3 {
        margin: 0;
        color: #111827;
        font-size: 18px;
        font-weight: 950;
      }

      .important-description {
        padding: 15px;
        color: #334155;
        font-size: 15.5px;
        line-height: 1.8;
        text-align: left;
        white-space: pre-line;
      }

      .important-title-image {
        margin-bottom: 22px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        background: #f8fafc;
      }

      .important-title-image img {
        display: block;
        width: 100%;
        max-height: 620px;
        object-fit: contain;
      }

      .important-notification-number {
        margin: -6px 0 22px;
        padding: 11px 14px;
        border-left: 4px solid #f97316;
        border-radius: 8px;
        background: #fff7ed;
        color: #7c2d12;
        font-size: 14px;
        font-weight: 750;
      }

      .important-image-grid {
        display: grid;
        gap: 12px;
        padding: 14px;
      }

      .important-image-grid img {
        width: 100%;
        max-height: 520px;
        object-fit: contain;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        background: #f8fafc;
      }

      .important-table-scroll {
        overflow-x: auto;
        padding: 14px;
      }

      .important-data-table {
        width: 100%;
        min-width: 560px;
        border-collapse: collapse;
        table-layout: auto;
      }

      .important-data-table th,
      .important-data-table td {
        padding: 10px 12px;
        border: 1px solid #dbe3ee;
        text-align: left;
        vertical-align: top;
        white-space: pre-line;
      }

      .important-data-table th {
        background: #eff6ff;
        color: #1e3a8a;
        font-size: 13px;
        font-weight: 900;
      }

      .important-table-note {
        margin: -4px 14px 14px;
        padding: 9px 11px;
        border-left: 3px solid #1d4ed8;
        border-radius: 7px;
        background: #f8fafc;
        color: #334155;
        font-size: 13px;
        line-height: 1.55;
        white-space: pre-line;
      }

      .important-simple-rows,
      .important-link-rows {
        display: grid;
      }

      .important-simple-rows > div,
      .important-link-rows > a {
        display: grid;
        grid-template-columns: minmax(140px, 0.75fr) minmax(0, 1.25fr);
        gap: 10px;
        padding: 8px 11px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 13.5px;
      }

      .important-simple-rows > div:last-child,
      .important-link-rows > a:last-child {
        border-bottom: 0;
      }

      .important-simple-rows span,
      .important-link-rows span {
        color: #475569;
        font-weight: 800;
      }

      .important-simple-rows strong {
        color: #0f172a;
      }

      .important-link-rows > a {
        color: inherit;
        text-decoration: none;
      }

      .important-link-rows > a strong {
        width: fit-content;
        color: #1d4ed8;
      }

      .important-link-rows > a:hover {
        background: #fff7ed;
      }

      .important-video-list {
        display: grid;
        gap: 16px;
        padding: 14px;
      }

      .important-video-card {
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        overflow: hidden;
        background: #ffffff;
      }

      .important-video-frame {
        position: relative;
        width: 100%;
        padding-top: 56.25%;
        background: #0f172a;
      }

      .important-video-frame iframe {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        border: 0;
      }

      .important-video-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
      }

      .important-video-footer a {
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

      .important-share-section {
        margin-top: 22px;
        padding: 12px 13px;
        min-width: 0;
        overflow: visible;
        border-radius: 13px;
        background: linear-gradient(135deg, #f0fdf4, #eff6ff);
        border: 1px solid #dbeafe;
      }

      .important-share-section p {
        margin: 0;
        font-size: 15px;
        font-weight: 950;
      }

      .important-share-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
      }

      .important-share-actions span {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        color: #e85d04;
        font-size: 28px;
        font-weight: 950;
      }

      .important-share-btn {
        display: inline-flex;
        align-items: center;
        min-height: 42px;
        padding: 9px 15px;
        border-radius: 999px;
        color: #ffffff;
        text-decoration: none;
        font-weight: 950;
      }

      .important-share-btn.whatsapp { background: #25d366; }
      .important-share-btn.telegram { background: #229ed9; }

      .important-quick-list {
        display: grid;
        margin-top: 13px;
        border: 1px solid #e5e7eb;
        border-radius: 13px;
        overflow: hidden;
      }

      .important-quick-list div {
        display: grid;
        gap: 4px;
        padding: 11px 12px;
        border-bottom: 1px solid #e5e7eb;
      }

      .important-quick-list div:last-child { border-bottom: 0; }
      .important-quick-list span { color: #64748b; font-size: 12px; font-weight: 900; }
      .important-quick-list strong { color: #0f172a; font-size: 14px; }

      .important-muted {
        margin: 12px 0 0;
        color: #64748b;
        line-height: 1.6;
        font-size: 14px;
      }

      .important-side-title-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 14px;
      }

      .important-related-list {
        display: grid;
        gap: 9px;
        margin-top: 13px;
      }

      .important-related-list a {
        color: #0b63ce;
        text-decoration: none;
        font-weight: 850;
        line-height: 1.45;
        padding-bottom: 9px;
        border-bottom: 1px dashed #e5e7eb;
      }

      .important-related-list a:hover { color: #e85d04; }
      .important-related-list a:last-child { border-bottom: 0; padding-bottom: 0; }

      @media (max-width: 900px) {
        .important-detail-grid { grid-template-columns: 1fr; padding: 14px; }
        .important-side-column { position: static; }
        .important-detail-header { padding: 16px; }
      }

      @media (max-width: 520px) {
        .important-detail-container { width: min(100% - 18px, 1180px); }
        .important-detail-grid { gap: 16px; padding: 12px; }
        .important-description { font-size: 15px; padding: 13px; text-align: left; }
        .important-video-footer { align-items: flex-start; flex-direction: column; }
        .important-video-footer a { width: 100%; justify-content: center; }
        .important-table-scroll {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding: 8px;
        }
        .important-data-table { min-width: 560px; table-layout: auto; }
        .important-data-table th,
        .important-data-table td {
          padding: 7px 8px;
          font-size: 11.5px;
          line-height: 1.35;
          overflow-wrap: normal;
          word-break: normal;
        }
        .important-simple-rows > div,
        .important-link-rows > a {
          grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
          padding: 8px 9px;
        }
        .important-share-section { padding: 11px; }
      }
    `}</style>
  );
}
