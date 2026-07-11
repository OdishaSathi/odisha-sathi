import type { Metadata } from "next";
import Link from "next/link";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { dbServer } from "@/lib/firebaseServer";
import {
  cleanImportantInfoPost,
  getImportantInfoDisplayImage,
  getImportantInfoOgImage,
  getImportantInfoYouTubeId,
  type ImportantInfoPost,
} from "@/lib/importantInformation";

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
  const category = normalizeText(post.category);

  if (category === "results") return `/results/${slug}`;
  if (category === "admissions") return `/admissions/${slug}`;
  if (category === "admit-cards") return `/admit-cards/${slug}`;
  if (category === "schemes") return `/schemes/${slug}`;
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
      return cleanImportantInfoPost(item.data(), item.id);
    }

    const directDoc = await getDoc(doc(dbServer, "importantInformation", pageSlug));

    if (directDoc.exists()) {
      return cleanImportantInfoPost(directDoc.data(), directDoc.id);
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

      if (!category || category === "tools") return;

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
  const canonicalUrl = `/important-information/${encodeURIComponent(slug)}`;

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

  if (!post || post.status === "hidden") {
    return (
      <main className="important-detail-page">
        <div className="important-detail-container">
          <div className="important-empty-card">
            <h1>Information not found</h1>
            <p>The requested important information is not available.</p>
            <Link href="/">Back to Home</Link>
          </div>
        </div>
        <ImportantDetailStyles />
      </main>
    );
  }

  const relatedPosts = await getRelatedPosts(post.referenceKeywords || []);
  const videos = [post.youtubeUrl, ...(post.youtubeUrls || [])]
    .map((item) => String(item || "").trim())
    .filter((item) => item && getImportantInfoYouTubeId(item));
  const shareTitle = post.shareTitle || post.title;
  const shareDescription = post.shareDescription || post.shortDescription || "";
  const shareUrl = `https://odishasathi.in/important-information/${post.slug || post.id}`;
  const previewImageUrl = getImportantInfoDisplayImage(post);
  const customImageUrls = (post.imageUrls || []).filter(Boolean);
  const detailImageUrls = customImageUrls.length > 0 ? customImageUrls : [previewImageUrl].filter(Boolean);
  const imageSectionTitle = customImageUrls.length > 0 ? "Images" : videos.length > 0 ? "Video Thumbnail" : "Preview Image";

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
              {detailImageUrls.length > 0 ? (
                <section className="important-section important-images-section">
                  <SectionHeader title={imageSectionTitle} />
                  <div className="important-image-grid">
                    {detailImageUrls.map((imageUrl, index) => (
                      <img key={`${imageUrl}-${index}`} src={imageUrl} alt={`${post.title} image ${index + 1}`} />
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="important-section">
                <SectionHeader title="Details" />
                <div className="important-description">{post.details || "Details will be updated soon."}</div>
              </section>

              {(post.detailSections || []).map((section, index) => (
                <section className="important-section" key={`${section.title}-${index}`}>
                  <SectionHeader title={section.title || `Information ${index + 1}`} />
                  <div className="important-description">{section.content}</div>
                </section>
              ))}

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
                <div className="important-share-actions">
                  <span aria-hidden="true">➜</span>
                  <a
                    className="important-share-btn whatsapp"
                    href={`https://wa.me/?text=${encodeURIComponent(`${shareTitle}\n${shareDescription}\n${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                  <a
                    className="important-share-btn telegram"
                    href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`${shareTitle}\n${shareDescription}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Telegram
                  </a>
                </div>
              </section>
            </section>

            <aside className="important-side-column">
              <div className="important-side-card">
                <h3>Quick Panel</h3>
                {post.quickInfoRows && post.quickInfoRows.length > 0 ? (
                  <div className="important-quick-list">
                    {post.quickInfoRows.map((row, index) => (
                      <div key={`${row.label}-${index}`}>
                        <span>{row.label}</span>
                        <strong>{row.value}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="important-muted">Quick information will be updated soon.</p>
                )}
              </div>

              <div className="important-side-card">
                <div className="important-side-title-row">
                  <h3>Relevant Posts</h3>
                </div>
                {relatedPosts.length > 0 ? (
                  <div className="important-related-list">
                    {relatedPosts.map((item) => (
                      <Link key={item.id} href={item.href}>{item.title}</Link>
                    ))}
                  </div>
                ) : (
                  <p className="important-muted">Relevant posts will appear here when matching keywords are found.</p>
                )}
              </div>

              <div className="important-side-card">
                <h3>Quick Access</h3>
                <div className="important-related-list">
                  <Link href="/jobs">Latest Jobs</Link>
                  <Link href="/admit-cards">Admit Cards & Exams</Link>
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
        white-space: pre-line;
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
        padding: 16px;
        border-radius: 18px;
        background: linear-gradient(135deg, #f0fdf4, #eff6ff);
        border: 1px solid #dbeafe;
      }

      .important-share-section p {
        margin: 0 0 13px;
        font-size: 17px;
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
        .important-description { font-size: 15px; padding: 13px; }
        .important-video-footer { align-items: flex-start; flex-direction: column; }
        .important-video-footer a,
        .important-share-btn { width: 100%; justify-content: center; }
      }
    `}</style>
  );
}
