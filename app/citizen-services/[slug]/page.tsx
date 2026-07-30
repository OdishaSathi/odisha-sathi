import type { Metadata } from "next";
import Link from "next/link";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { dbServer } from "@/lib/firebaseServer";
import SocialShareButtons from "@/components/public/SocialShareButtons";
import {
  CitizenServicePost,
  getYouTubeId,
  getYouTubeThumbnail,
  normalizeOverviewRows,
  normalizeServiceDocuments,
} from "@/lib/citizenServices";
import {
  normalizeFlexibleDataTables,
  normalizeFlexibleDetailSections,
} from "@/lib/flexibleDetails";
import { isPublicDetailPost } from "@/lib/publicPostQuality";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function cleanText(value: unknown, limitLength = 160) {
  const text = String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > limitLength
    ? `${text.slice(0, limitLength - 3)}...`
    : text;
}

function normalizeService(data: any, id: string): CitizenServicePost {
  return {
    id,
    title: String(data.title || "").trim(),
    slug: String(data.slug || id).trim(),
    category: "citizen-services",
    subCategory: String(data.subCategory || "").trim(),
    subCategoryLabel: String(data.subCategoryLabel || "").trim(),
    subCategories: Array.isArray(data.subCategories)
      ? data.subCategories
      : [],
    shortDescription: String(data.shortDescription || "").trim(),
    description: String(data.description || data.content || "").trim(),
    notificationNumber: String(
      data.notificationNumber || data.notificationNo || ""
    ).trim(),
    previewImageUrl: String(
      data.previewImageUrl || data.imageUrl || ""
    ).trim(),
    overviewRows: normalizeOverviewRows(data.overviewRows),
    contentSections: normalizeFlexibleDetailSections(
      data.contentSections || data.detailSections
    ),
    dataTables: normalizeFlexibleDataTables(
      data.dataTables || data.customTables
    ),
    documentsRequired: normalizeServiceDocuments(data.documentsRequired),
    eligibility: String(data.eligibility || "").trim(),
    fees: String(data.fees || data.feeStructure || "").trim(),
    howToApply: String(
      data.howToApply || data.applicationProcess || ""
    ).trim(),
    youtubeUrl: String(data.youtubeUrl || "").trim(),
    youtubeUrl2: String(
      data.youtubeUrl2 ||
        (Array.isArray(data.youtubeUrls) ? data.youtubeUrls[0] : "") ||
        ""
    ).trim(),
    importantDates: Array.isArray(data.importantDates)
      ? data.importantDates
      : [],
    importantLinks: Array.isArray(data.importantLinks)
      ? data.importantLinks
      : Array.isArray(data.links)
      ? data.links
      : [],
    shareTitle: String(data.shareTitle || "").trim(),
    shareDescription: String(data.shareDescription || "").trim(),
    status: "published",
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
}

async function getService(slug: string) {
  const pageSlug = decodeURIComponent(slug);
  try {
    const bySlug = query(
      collection(dbServer, "posts"),
      where("slug", "==", pageSlug),
      limit(1)
    );
    const snapshot = await getDocs(bySlug);
    if (!snapshot.empty) {
      const item = snapshot.docs[0];
      const data = item.data();
      if (
        data.category === "citizen-services" &&
        isPublicDetailPost(data, item.id)
      ) {
        return normalizeService(data, item.id);
      }
    }

    const direct = await getDoc(doc(dbServer, "posts", pageSlug));
    if (direct.exists()) {
      const data = direct.data();
      if (
        data.category === "citizen-services" &&
        isPublicDetailPost(data, direct.id)
      ) {
        return normalizeService(data, direct.id);
      }
    }
  } catch (error) {
    console.error("Citizen Service fetch failed", error);
  }
  return null;
}

async function getRelatedServices(current: CitizenServicePost) {
  try {
    const snapshot = await getDocs(collection(dbServer, "posts"));
    return snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter(
        (item: any) =>
          item.id !== current.id &&
          item.category === "citizen-services" &&
          isPublicDetailPost(item, item.id) &&
          (() => {
            const currentCategories = new Set(
              [
                current.subCategory,
                current.subCategoryLabel,
                ...(current.subCategories || []),
              ]
                .map((value) => String(value || "").trim().toLowerCase())
                .filter(Boolean)
            );
            return [
              item.subCategory,
              item.subCategoryLabel,
              ...(Array.isArray(item.subCategories)
                ? item.subCategories
                : []),
            ].some((value) =>
              currentCategories.has(
                String(value || "").trim().toLowerCase()
              )
            );
          })()
      )
      .sort(
        (a: any, b: any) =>
          (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      )
      .slice(0, 8);
  } catch {
    return [];
  }
}

function getDefaultBanner(post: CitizenServicePost) {
  const serviceType =
    post.subCategoryLabel ||
    post.overviewRows.find((row) =>
      /service type|category/i.test(row.label)
    )?.value ||
    "Citizen Service";
  const documentOrBenefit =
    post.documentsRequired[0]?.name ||
    post.overviewRows.find((row) =>
      /benefit|document/i.test(row.label)
    )?.value ||
    post.shortDescription ||
    "Documents • Eligibility • Apply Process";
  const params = new URLSearchParams({
    category: "Citizen Services",
    title: post.title,
    department: serviceType,
    posts: documentOrBenefit,
  });
  return `/api/og/post?${params.toString()}`;
}

function getPreviewImage(post: CitizenServicePost) {
  return (
    post.previewImageUrl ||
    getYouTubeThumbnail(post.youtubeUrl) ||
    getDefaultBanner(post)
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getService(slug);
  const title = cleanText(
    post?.shareTitle || post?.title || "Citizen Services",
    90
  );
  const description = cleanText(
    post?.shareDescription ||
      post?.shortDescription ||
      post?.description ||
      "Citizen Services from Odisha Sathi."
  );
  const canonical = `/citizen-services/${encodeURIComponent(slug)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      images: post ? [getPreviewImage(post)] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post ? [getPreviewImage(post)] : [],
    },
  };
}

function YouTubeThumbnail({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const id = getYouTubeId(url);
  if (!id) return null;

  return (
    <a
      className="service-youtube-thumbnail"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt={`${title} video guide`}
      />
      <span>▶ Watch Video Guide</span>
    </a>
  );
}

export default async function CitizenServiceDetailPage({
  params,
}: PageProps) {
  const { slug } = await params;
  const post = await getService(slug);

  if (!post) {
    return (
      <main className="service-detail-page">
        <div className="service-detail-container">
          <div className="service-empty">
            <h1>Citizen Service not found</h1>
            <Link href="/citizen-services">Back to Citizen Services</Link>
          </div>
        </div>
        <ServiceStyles />
      </main>
    );
  }

  const related = await getRelatedServices(post);
  const previewImage = getPreviewImage(post);
  const shareUrl = `https://odishasathi.in/citizen-services/${post.slug || post.id}`;

  return (
    <main className="service-detail-page">
      <div className="service-detail-container">
        <nav className="service-breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/citizen-services">Citizen Services</Link>
          <span>/</span>
          <span>{post.title}</span>
        </nav>

        <article className="service-detail-shell">
          <header>
            <span>{post.subCategoryLabel || "Citizen Service"}</span>
            <h1>{post.title}</h1>
            {post.shortDescription ? <p>{post.shortDescription}</p> : null}
            {post.notificationNumber ? (
              <small>
                Notification / Reference No.:{" "}
                <strong>{post.notificationNumber}</strong>
              </small>
            ) : null}
          </header>

          <div className="service-main">
            <div className="service-preview">
              <img src={previewImage} alt={`${post.title} preview`} />
            </div>

            {post.overviewRows.length > 0 ? (
              <section className="service-section">
                <SectionTitle title="Service Overview" />
                <div className="service-overview-table">
                  {post.overviewRows.map((row) => (
                    <div key={row.id}>
                      <span>{row.label}</span>
                      <strong>{row.value || "—"}</strong>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <YouTubeThumbnail url={post.youtubeUrl} title={post.title} />

            {post.description ? (
              <section className="service-section">
                <SectionTitle title="Service Details" />
                <div className="service-text">{post.description}</div>
              </section>
            ) : null}

            {post.contentSections.map((section, index) => (
              <section className="service-section" key={section.id || index}>
                <SectionTitle title={section.title || `Details ${index + 1}`} />
                {section.imageUrls.length > 0 ? (
                  <div className="service-images">
                    {section.imageUrls.map((url, imageIndex) => (
                      <img
                        src={url}
                        alt={`${section.title || post.title} image ${imageIndex + 1}`}
                        key={`${url}-${imageIndex}`}
                      />
                    ))}
                  </div>
                ) : null}
                {section.content ? (
                  <div className="service-text">{section.content}</div>
                ) : null}
              </section>
            ))}

            {post.dataTables.map((table, index) => (
              <section className="service-section" key={table.id || index}>
                <SectionTitle title={table.title || `Data Table ${index + 1}`} />
                {table.imageUrl ? (
                  <div className="service-images">
                    <img src={table.imageUrl} alt={`${table.title} reference`} />
                  </div>
                ) : null}
                {table.rows.length > 0 ? (
                  <div className="service-table-scroll">
                    <table>
                      <thead>
                        <tr>
                          {table.columns.map((column, columnIndex) => (
                            <th key={columnIndex}>
                              {column || `Column ${columnIndex + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row) => (
                          <tr key={row.id}>
                            {table.columns.map((_, cellIndex) => (
                              <td key={cellIndex}>
                                {row.cells[cellIndex] || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </section>
            ))}

            {post.documentsRequired.length > 0 ? (
              <section className="service-section">
                <SectionTitle title="Documents Required" />
                <div className="service-table-scroll compact">
                  <table>
                    <thead>
                      <tr>
                        <th>Sl. No.</th>
                        <th>Document Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {post.documentsRequired.map((document, index) => (
                        <tr key={document.id}>
                          <td>{index + 1}</td>
                          <td>{document.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {post.eligibility ? (
              <section className="service-section">
                <SectionTitle title="Eligibility / Who Can Apply" />
                <div className="service-text">{post.eligibility}</div>
              </section>
            ) : null}

            {post.fees ? (
              <section className="service-section">
                <SectionTitle title="Fees / Charges" />
                <div className="service-text">{post.fees}</div>
              </section>
            ) : null}

            {post.howToApply ? (
              <section className="service-section">
                <SectionTitle title="How to Apply" />
                <div className="service-text">{post.howToApply}</div>
              </section>
            ) : null}

            <YouTubeThumbnail url={post.youtubeUrl2} title={post.title} />

            {post.importantDates.length > 0 ? (
              <section className="service-section">
                <SectionTitle title="Important Dates" />
                <div className="service-simple-list">
                  {post.importantDates.map((row, index) => (
                    <div key={row.id || index}>
                      <span>{row.label || row.type || "Date"}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {post.importantLinks.length > 0 ? (
              <section className="service-section">
                <SectionTitle title="Important Links" />
                <div className="service-link-list">
                  {post.importantLinks.map((row, index) => (
                    <a
                      key={row.id || index}
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>{row.label || row.type || "Official Link"}</span>
                      <strong>Open Link</strong>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="service-share">
              <h2>Share this Citizen Service</h2>
              <SocialShareButtons
                title={post.shareTitle || post.title}
                description={
                  post.shareDescription || post.shortDescription
                }
                postUrl={shareUrl}
              />
            </section>

            {related.length > 0 ? (
              <section className="service-section">
                <SectionTitle title="Related Services" />
                <div className="service-related-list">
                  {related.map((item: any) => (
                    <Link
                      href={`/citizen-services/${item.slug || item.id}`}
                      key={item.id}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </article>
      </div>
      <ServiceStyles />
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="service-section-title">
      <h2>{title}</h2>
    </div>
  );
}

function ServiceStyles() {
  return (
    <style>{`
      .service-detail-page {
        min-height: 100vh;
        padding: 18px 0 42px;
        background: #f5f7fb;
        color: #0f172a;
      }
      .service-detail-container {
        width: min(980px, calc(100% - 24px));
        margin: 0 auto;
      }
      .service-breadcrumb {
        display: flex;
        gap: 7px;
        flex-wrap: wrap;
        margin-bottom: 12px;
        color: #64748b;
        font-size: 13px;
      }
      .service-breadcrumb a {
        color: #1d4ed8;
        font-weight: 800;
        text-decoration: none;
      }
      .service-detail-shell,
      .service-empty {
        overflow: hidden;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        background: #ffffff;
        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.07);
      }
      .service-empty {
        padding: 24px;
      }
      .service-detail-shell > header {
        padding: 20px;
        border-bottom: 1px solid #e5e7eb;
        background: linear-gradient(180deg, #ffffff, #f0fdfa);
      }
      .service-detail-shell > header > span {
        display: inline-flex;
        padding: 5px 10px;
        border-radius: 999px;
        background: #ccfbf1;
        color: #115e59;
        font-size: 12px;
        font-weight: 900;
      }
      .service-detail-shell h1 {
        margin: 10px 0 0;
        font-size: clamp(26px, 4vw, 40px);
        line-height: 1.18;
        letter-spacing: -0.035em;
      }
      .service-detail-shell header p {
        margin: 10px 0 0;
        color: #475569;
        line-height: 1.65;
        text-align: left;
      }
      .service-detail-shell header small {
        display: block;
        margin-top: 10px;
        color: #9a3412;
      }
      .service-main {
        padding: 18px;
      }
      .service-preview,
      .service-youtube-thumbnail,
      .service-section,
      .service-share {
        margin-bottom: 20px;
        overflow: hidden;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        background: #ffffff;
      }
      .service-preview img {
        display: block;
        width: 100%;
        max-height: 620px;
        object-fit: contain;
        background: #f8fafc;
      }
      .service-section-title {
        padding: 12px 14px;
        border-bottom: 1px solid #e5e7eb;
        background: #f8fafc;
      }
      .service-section-title h2,
      .service-share h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 950;
      }
      .service-text {
        padding: 14px;
        color: #334155;
        line-height: 1.8;
        text-align: left;
        white-space: pre-line;
      }
      .service-overview-table,
      .service-simple-list,
      .service-link-list {
        display: grid;
      }
      .service-overview-table > div,
      .service-simple-list > div,
      .service-link-list > a {
        display: grid;
        grid-template-columns: minmax(150px, 0.65fr) minmax(0, 1.35fr);
        gap: 10px;
        padding: 8px 11px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 13.5px;
      }
      .service-overview-table > div:last-child,
      .service-simple-list > div:last-child,
      .service-link-list > a:last-child {
        border-bottom: 0;
      }
      .service-overview-table span,
      .service-simple-list span,
      .service-link-list span {
        color: #64748b;
        font-weight: 800;
      }
      .service-link-list > a {
        color: inherit;
        text-decoration: none;
      }
      .service-link-list strong {
        width: fit-content;
        color: #1d4ed8;
      }
      .service-youtube-thumbnail {
        position: relative;
        display: block;
        color: #ffffff;
        text-decoration: none;
        background: #0f172a;
      }
      .service-youtube-thumbnail img {
        display: block;
        width: 100%;
        max-height: 520px;
        object-fit: cover;
        opacity: 0.84;
      }
      .service-youtube-thumbnail span {
        position: absolute;
        left: 50%;
        bottom: 18px;
        transform: translateX(-50%);
        min-width: 190px;
        padding: 10px 15px;
        border-radius: 999px;
        background: #dc2626;
        text-align: center;
        font-weight: 900;
      }
      .service-images {
        display: grid;
        gap: 10px;
        padding: 14px;
      }
      .service-images img {
        width: 100%;
        max-height: 560px;
        object-fit: contain;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        background: #f8fafc;
      }
      .service-table-scroll {
        overflow-x: auto;
        padding: 14px;
      }
      .service-table-scroll table {
        width: 100%;
        min-width: 520px;
        border-collapse: collapse;
      }
      .service-table-scroll.compact table {
        min-width: 420px;
      }
      .service-table-scroll th,
      .service-table-scroll td {
        padding: 10px 11px;
        border: 1px solid #dbe3ee;
        text-align: left;
        vertical-align: top;
        white-space: pre-line;
      }
      .service-table-scroll th {
        background: #f0fdfa;
        color: #115e59;
        font-size: 13px;
      }
      .service-share {
        padding: 12px 13px;
        background: linear-gradient(135deg, #f0fdf4, #eff6ff);
      }
      .service-share > div {
        justify-content: flex-start !important;
      }
      .service-related-list {
        display: grid;
      }
      .service-related-list a {
        padding: 11px 14px;
        border-bottom: 1px solid #e5e7eb;
        color: #1d4ed8;
        font-weight: 800;
        text-decoration: none;
      }
      .service-related-list a:last-child {
        border-bottom: 0;
      }
      @media (max-width: 600px) {
        .service-main {
          padding: 12px;
        }
        .service-text,
        .service-detail-shell header p {
          text-align: left;
        }
        .service-overview-table > div,
        .service-simple-list > div,
        .service-link-list > a {
          grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
          gap: 8px;
          padding: 8px 9px;
        }
        .service-table-scroll {
          overflow-x: visible;
          padding: 8px;
        }
        .service-table-scroll table,
        .service-table-scroll.compact table {
          min-width: 0;
          table-layout: fixed;
        }
        .service-table-scroll th,
        .service-table-scroll td {
          padding: 7px 5px;
          font-size: 11.5px;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .service-share { padding: 11px; }
      }
    `}</style>
  );
}
