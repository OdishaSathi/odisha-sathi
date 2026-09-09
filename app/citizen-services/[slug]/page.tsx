import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
import { getPublicLinkAction } from "@/lib/publicLinkLabels";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ lang?: string | string[] }>;
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
    titleOdia: String(data.titleOdia || data.odiaTitle || "").trim(),
    shortDescriptionOdia: String(data.shortDescriptionOdia || data.odiaShortDescription || "").trim(),
    descriptionOdia: String(data.descriptionOdia || data.odiaDescription || "").trim(),
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
    eligibilityOdia: String(
      data.eligibilityOdia ||
        data.odiaEligibility ||
        data.eligibility_odia ||
        data.eligibilityOR ||
        data.odia?.eligibility ||
        ""
    ).trim(),
    feesOdia: String(data.feesOdia || data.odiaFees || data.fees_odia || data.odia?.fees || "").trim(),
    howToApplyOdia: String(
      data.howToApplyOdia || data.odiaHowToApply || data.howToApply_odia || data.odia?.howToApply || ""
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
    shareTitleOdia: String(data.shareTitleOdia || data.odiaShareTitle || "").trim(),
    shareDescriptionOdia: String(data.shareDescriptionOdia || data.odiaShareDescription || "").trim(),
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
  const canonicalSlug = post?.slug || post?.id || decodeURIComponent(slug);
  const canonical = `/citizen-services/${encodeURIComponent(canonicalSlug)}`;

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
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const queryParams = searchParams ? await searchParams : undefined;
  const rawLanguage = Array.isArray(queryParams?.lang) ? queryParams?.lang[0] : queryParams?.lang;
  const useOdia = rawLanguage === "odia" || rawLanguage === "or";
  const post = await getService(slug);

  if (!post) {
    notFound();
  }

  const requestedSlug = decodeURIComponent(slug).trim();
  const canonicalSlug = String(post.slug || post.id || requestedSlug).trim();
  if (canonicalSlug && canonicalSlug !== requestedSlug) {
    redirect(
      `/citizen-services/${encodeURIComponent(canonicalSlug)}${useOdia ? "?lang=odia" : ""}`
    );
  }

  const localized = (english: unknown, odia: unknown) => {
    const englishText = String(english || "").trim();
    if (!useOdia) return englishText;
    return String(odia || "").trim() || englishText;
  };

  const ui = useOdia
    ? {
        overview: "ସେବା ସଂକ୍ଷିପ୍ତ ବିବରଣୀ",
        details: "ସେବା ବିବରଣୀ",
        documents: "ଆବଶ୍ୟକ ଦଲିଲ",
        eligibility: "ଯୋଗ୍ୟତା / କିଏ ଆବେଦନ କରିପାରିବେ",
        fees: "ଶୁଳ୍କ / ଚାର୍ଜ",
        howToApply: "କିପରି ଆବେଦନ କରିବେ",
        dates: "ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ତାରିଖ",
        links: "ଗୁରୁତ୍ୱପୂର୍ଣ୍ଣ ଲିଙ୍କ",
        share: "ଏହି ସେବାଟି ସେୟାର କରନ୍ତୁ",
        related: "ସମ୍ବନ୍ଧିତ ସେବା",
        reference: "ବିଜ୍ଞପ୍ତି / ସନ୍ଦର୍ଭ ନଂ.",
        citizenService: "ନାଗରିକ ସେବା",
        serial: "କ୍ରମିକ ନଂ.",
        document: "ଆବଶ୍ୟକ ଦଲିଲ",
      }
    : {
        overview: "Service Overview",
        details: "Service Details",
        documents: "Documents Required",
        eligibility: "Eligibility / Who Can Apply",
        fees: "Fees / Charges",
        howToApply: "How to Apply",
        dates: "Important Dates",
        links: "Important Links",
        share: "Share this Citizen Service",
        related: "Related Services",
        reference: "Notification / Reference No.",
        citizenService: "Citizen Service",
        serial: "Sl. No.",
        document: "Document Required",
      };

  const displayTitle = localized(post.title, post.titleOdia);
  const displayShortDescription = localized(post.shortDescription, post.shortDescriptionOdia);
  const displayDescription = localized(post.description, post.descriptionOdia);
  const displayEligibility = localized(post.eligibility, post.eligibilityOdia);
  const displayFees = localized(post.fees, post.feesOdia);
  const displayHowToApply = localized(post.howToApply, post.howToApplyOdia);

  const overviewRows = post.overviewRows
    .map((row) => ({
      ...row,
      displayLabel: localized(row.label, row.labelOdia),
      displayValue: localized(row.value, row.valueOdia),
    }))
    .filter((row) => Boolean(row.displayValue));

  const contentSections = post.contentSections
    .map((section) => ({
      ...section,
      displayTitle: localized(section.title, section.titleOdia),
      displayContent: localized(section.content, section.contentOdia),
    }))
    .filter((section) => {
      const hasImages = (section.imageUrls || []).some((url) => Boolean(String(url || "").trim()));
      return Boolean(section.displayContent) || hasImages;
    });

  const dataTables = post.dataTables
    .map((table) => {
      const displayColumns = (table.columns || []).map((column, index) =>
        localized(column, table.columnsOdia?.[index])
      );
      const displayRows = (table.rows || [])
        .map((row) => ({
          ...row,
          displayCells: displayColumns.map((_, index) =>
            localized(row.cells?.[index], row.cellsOdia?.[index])
          ),
        }))
        .filter((row) => row.displayCells.some(Boolean));
      return {
        ...table,
        displayTitle: localized(table.title, table.titleOdia),
        displayNote: localized(table.note, table.noteOdia),
        displayColumns,
        displayRows,
      };
    })
    .filter((table) =>
      Boolean(String(table.imageUrl || "").trim()) ||
      Boolean(table.displayNote) ||
      table.displayRows.length > 0
    );

  const documents = post.documentsRequired
    .map((document) => ({
      ...document,
      displayName: localized(document.name, document.nameOdia),
    }))
    .filter((document) => Boolean(document.displayName));

  const importantDates = post.importantDates
    .map((row) => ({
      ...row,
      displayLabel: localized(row.label || row.type, row.labelOdia),
    }))
    .filter((row) => Boolean(String(row.value || "").trim()));

  const importantLinks = post.importantLinks
    .map((row) => ({
      ...row,
      displayLabel: localized(row.label || row.type, row.labelOdia),
    }))
    .filter((row) => Boolean(String(row.url || "").trim()));

  const related = await getRelatedServices(post);
  const previewImage = getPreviewImage(post);
  const shareUrl = `https://odishasathi.in/citizen-services/${post.slug || post.id}`;
  const englishHref = `/citizen-services/${encodeURIComponent(canonicalSlug)}`;
  const odiaHref = `${englishHref}?lang=odia`;

  return (
    <main className="service-detail-page">
      <div className="service-detail-container">
        <nav className="service-breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/citizen-services">Citizen Services</Link>
          <span>/</span>
          <span>{displayTitle}</span>
        </nav>

        <div className="service-language-switch" aria-label="Citizen Service language">
          <span aria-hidden="true">🌐</span>
          <Link href={englishHref} className={!useOdia ? "active" : ""}>English</Link>
          <span className="service-language-divider">|</span>
          <Link href={odiaHref} className={useOdia ? "active" : ""}>ଓଡ଼ିଆ</Link>
        </div>

        <article className="service-detail-shell">
          <header>
            <span>{post.subCategoryLabel || ui.citizenService}</span>
            <h1>{displayTitle}</h1>
            {displayShortDescription ? <p>{displayShortDescription}</p> : null}
            {post.notificationNumber ? (
              <small>
                {ui.reference}: {" "}
                <strong>{post.notificationNumber}</strong>
              </small>
            ) : null}
          </header>

          <div className="service-main">
            <div className="service-preview">
              <img src={previewImage} alt={`${displayTitle} preview`} />
            </div>

            {overviewRows.length > 0 ? (
              <section className="service-section">
                <SectionTitle title={ui.overview} />
                <div className="service-overview-table">
                  {overviewRows.map((row) => (
                    <div key={row.id}>
                      {row.displayLabel ? <span>{row.displayLabel}</span> : <span />}
                      <strong>{row.displayValue}</strong>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <YouTubeThumbnail url={post.youtubeUrl} title={displayTitle} />

            {displayDescription ? (
              <section className="service-section">
                <SectionTitle title={ui.details} />
                <div className="service-text">{displayDescription}</div>
              </section>
            ) : null}

            {contentSections.map((section, index) => (
              <section className="service-section" key={section.id || index}>
                {section.displayTitle ? <SectionTitle title={section.displayTitle} /> : null}
                {section.imageUrls.length > 0 ? (
                  <div className="service-images">
                    {section.imageUrls.map((url, imageIndex) => (
                      <img
                        src={url}
                        alt={`${section.displayTitle || displayTitle} image ${imageIndex + 1}`}
                        key={`${url}-${imageIndex}`}
                      />
                    ))}
                  </div>
                ) : null}
                {section.displayContent ? (
                  <div className="service-text">{section.displayContent}</div>
                ) : null}
              </section>
            ))}

            {dataTables.map((table, index) => {
              const showHeader = table.displayColumns.some(Boolean);
              return (
                <section className="service-section" key={table.id || index}>
                  {table.displayTitle ? <SectionTitle title={table.displayTitle} /> : null}
                  {table.imageUrl ? (
                    <div className="service-images">
                      <img src={table.imageUrl} alt={`${table.displayTitle || displayTitle} reference`} />
                    </div>
                  ) : null}
                  {table.displayRows.length > 0 ? (
                    <div className="service-table-scroll">
                      <table>
                        {showHeader ? (
                          <thead>
                            <tr>
                              {table.displayColumns.map((column, columnIndex) => (
                                <th key={columnIndex}>{column}</th>
                              ))}
                            </tr>
                          </thead>
                        ) : null}
                        <tbody>
                          {table.displayRows.map((row) => (
                            <tr key={row.id}>
                              {row.displayCells.map((cell, cellIndex) => (
                                <td key={cellIndex}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                  {table.displayNote ? (
                    <div className="service-table-note">{table.displayNote}</div>
                  ) : null}
                </section>
              );
            })}

            {documents.length > 0 ? (
              <section className="service-section">
                <SectionTitle title={ui.documents} />
                <div className="service-table-scroll compact">
                  <table>
                    <thead>
                      <tr>
                        <th>{ui.serial}</th>
                        <th>{ui.document}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((document, index) => (
                        <tr key={document.id}>
                          <td>{index + 1}</td>
                          <td>{document.displayName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {displayEligibility ? (
              <section className="service-section">
                <SectionTitle title={ui.eligibility} />
                <div className="service-text">{displayEligibility}</div>
              </section>
            ) : null}

            {displayFees ? (
              <section className="service-section">
                <SectionTitle title={ui.fees} />
                <div className="service-text">{displayFees}</div>
              </section>
            ) : null}

            {displayHowToApply ? (
              <section className="service-section">
                <SectionTitle title={ui.howToApply} />
                <div className="service-text">{displayHowToApply}</div>
              </section>
            ) : null}

            <YouTubeThumbnail url={post.youtubeUrl2} title={displayTitle} />

            {importantDates.length > 0 ? (
              <section className="service-section">
                <SectionTitle title={ui.dates} />
                <div className="service-simple-list">
                  {importantDates.map((row, index) => (
                    <div key={row.id || index}>
                      <span>{row.displayLabel}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {importantLinks.length > 0 ? (
              <section className="service-section">
                <SectionTitle title={ui.links} />
                <div className="service-link-list">
                  {importantLinks.map((row, index) => (
                    <a
                      key={row.id || index}
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>{row.displayLabel}</span>
                      <strong>{getPublicLinkAction(row)}</strong>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="service-share">
              <h2>{ui.share}</h2>
              <SocialShareButtons
                title={localized(post.shareTitle || post.title, post.shareTitleOdia || post.titleOdia)}
                description={localized(
                  post.shareDescription || post.shortDescription,
                  post.shareDescriptionOdia || post.shortDescriptionOdia
                )}
                postUrl={shareUrl}
              />
            </section>

            {related.length > 0 ? (
              <section className="service-section">
                <SectionTitle title={ui.related} />
                <div className="service-related-list">
                  {related.map((item: any) => (
                    <Link
                      href={`/citizen-services/${item.slug || item.id}${useOdia ? "?lang=odia" : ""}`}
                      key={item.id}
                    >
                      {useOdia && String(item.titleOdia || "").trim() ? item.titleOdia : item.title}
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
      .service-language-switch {
        position: sticky;
        top: 8px;
        z-index: 20;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 7px;
        width: fit-content;
        max-width: 100%;
        margin: 0 0 9px auto;
        padding: 6px 9px;
        border: 1px solid #dbeafe;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
        backdrop-filter: blur(8px);
        font-size: 12px;
        white-space: nowrap;
      }
      .service-language-switch a {
        color: #64748b;
        font-weight: 900;
        text-decoration: none;
      }
      .service-language-switch a.active {
        color: #1d4ed8;
      }
      .service-language-divider {
        color: #cbd5e1;
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
        min-width: 560px;
        border-collapse: collapse;
        table-layout: auto;
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
      .service-table-note {
        margin: -4px 14px 14px;
        padding: 9px 11px;
        border-left: 3px solid #0f766e;
        border-radius: 7px;
        background: #f8fafc;
        color: #334155;
        font-size: 13px;
        line-height: 1.55;
        white-space: pre-line;
      }
      .service-share {
        padding: 12px 13px;
        overflow: visible;
        min-width: 0;
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
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding: 8px;
        }
        .service-table-scroll table {
          min-width: 560px;
          table-layout: auto;
        }
        .service-table-scroll.compact table {
          min-width: 390px;
        }
        .service-table-scroll th,
        .service-table-scroll td {
          padding: 7px 8px;
          font-size: 11.5px;
          line-height: 1.35;
          overflow-wrap: normal;
          word-break: normal;
        }
        .service-language-switch {
          top: 6px;
          margin-bottom: 7px;
          padding: 5px 8px;
          font-size: 11.5px;
        }
        .service-share { padding: 11px; }
      }
    `}</style>
  );
}
