"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

type ImportantItem = {
  label?: string;
  value?: string;
  url?: string;
};

type SchemePost = {
  id: string;
  title?: string;
  schemeName?: string;
  department?: string;
  schemeCategory?: string;
  schemeCategorySlug?: string;
  eligibility?: string;
  benefit?: string;
  startDate?: string;
  lastDate?: string;
  description?: string;
  content?: string;
  officialSite?: string;
  officialPdf?: string;
  applyLink?: string;
  notificationLink?: string;
  youtubeUrl?: string;
  status?: string;
  published?: boolean;
  category?: string;
  importantDates?: ImportantItem[];
  importantLinks?: ImportantItem[];
  links?: ImportantItem[];
};

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getYouTubeEmbedUrl(url?: string) {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url.trim());

    if (parsedUrl.hostname.includes("youtu.be")) {
      const videoId = parsedUrl.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }

    if (parsedUrl.hostname.includes("youtube.com")) {
      const videoId = parsedUrl.searchParams.get("v");

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

      if (pathParts[0] === "embed" && pathParts[1]) {
        return `https://www.youtube.com/embed/${pathParts[1]}`;
      }

      if (pathParts[0] === "shorts" && pathParts[1]) {
        return `https://www.youtube.com/embed/${pathParts[1]}`;
      }

      if (pathParts[0] === "live" && pathParts[1]) {
        return `https://www.youtube.com/embed/${pathParts[1]}`;
      }
    }

    return "";
  } catch {
    return "";
  }
}

function openWhatsAppShare(title: string) {
  const pageUrl = window.location.href;
  const text = encodeURIComponent(`${title}\n${pageUrl}`);
  window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
}

function openTelegramShare(title: string) {
  const pageUrl = window.location.href;
  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(title);

  window.open(
    `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    "_blank",
    "noopener,noreferrer"
  );
}

export default function SchemeDetailsPage() {
  const params = useParams();

  const schemeId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : "";

  const [scheme, setScheme] = useState<SchemePost | null>(null);
  const [loading, setLoading] = useState(true);

  const youtubeEmbedUrl = useMemo(
    () => getYouTubeEmbedUrl(scheme?.youtubeUrl),
    [scheme?.youtubeUrl]
  );

  const importantLinks = useMemo(() => {
    if (scheme?.importantLinks && scheme.importantLinks.length > 0) {
      return scheme.importantLinks;
    }

    if (scheme?.links && scheme.links.length > 0) {
      return scheme.links;
    }

    return [
      { label: "Official Site", url: scheme?.officialSite },
      { label: "Official PDF", url: scheme?.officialPdf },
      { label: "Apply Online", url: scheme?.applyLink },
      { label: "Notification / Guideline", url: scheme?.notificationLink },
    ].filter((item) => item.url);
  }, [scheme]);

  useEffect(() => {
    const loadScheme = async () => {
      if (!schemeId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        let matchedId = schemeId;
        let data: any = null;

        const directRef = doc(db, "posts", schemeId);
        const directSnap = await getDoc(directRef);

        if (directSnap.exists()) {
          const directData = directSnap.data();

          if (
            directData.category === "schemes" &&
            directData.published !== false
          ) {
            matchedId = directSnap.id;
            data = directData;
          }
        }

        if (!data) {
          const q = query(
            collection(db, "posts"),
            where("category", "==", "schemes")
          );

          const snapshot = await getDocs(q);

          const matchedDoc = snapshot.docs.find((docItem) => {
            const item = docItem.data();

            return (
              item.published !== false &&
              (item.slug === schemeId || docItem.id === schemeId)
            );
          });

          if (!matchedDoc) {
            setScheme(null);
            return;
          }

          matchedId = matchedDoc.id;
          data = matchedDoc.data();
        }

        setScheme({
          id: matchedId,
          title: data.title || "",
          schemeName: data.schemeName || data.title || "",
          department: data.department || "",
          schemeCategory: data.schemeCategory || "Government Schemes",
          schemeCategorySlug: data.schemeCategorySlug || "",
          eligibility: data.eligibility || "",
          benefit: data.benefit || data.amountBenefit || "",
          startDate: data.startDate || data.applicationStartDate || "",
          lastDate: data.lastDate || "",
          description: data.description || data.content || "",
          content: data.content || "",
          officialSite: data.officialSite || "",
          officialPdf: data.officialPdf || data.guidelinePdfLink || "",
          applyLink: data.applyLink || data.applicationLink || "",
          notificationLink: data.notificationLink || "",
          youtubeUrl: data.youtubeUrl || "",
          status: data.status || "active",
          published: data.published,
          category: data.category || "",
          importantDates: data.importantDates || [],
          importantLinks: data.importantLinks || [],
          links: data.links || [],
        });
      } catch (error) {
        console.error(error);
        alert("Failed to load scheme");
      } finally {
        setLoading(false);
      }
    };

    loadScheme();
  }, [schemeId]);

  if (loading) {
    return (
      <main className="admit-detail-page">
        <section className="admit-container admit-detail-section">
          <div className="admit-empty-box">
            <p>Loading scheme...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!scheme) {
    return (
      <main className="admit-detail-page">
        <section className="admit-container admit-detail-section">
          <div className="admit-empty-box">
            <h1>Scheme not found</h1>
            <p>This scheme may have been removed or the link may be wrong.</p>
            <Link className="admit-primary-btn" href="/schemes">
              Back to Schemes
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const name = scheme.schemeName || scheme.title || "Untitled Scheme";
  const description = scheme.description || scheme.content || "";
  const statusText = scheme.status === "closed" ? "Closed" : "Active";
  const statusClass = scheme.status === "closed" ? "not-released" : "released";

  return (
    <main className="admit-detail-page">
      <section className="admit-detail-hero">
        <div className="admit-container">
          <Link className="admit-back-link" href="/schemes">
            ← Back to Schemes
          </Link>

          <span className={`admit-status-pill admit-status-${statusClass}`}>
            {statusText}
          </span>

          <h1>{name}</h1>
          <p>{scheme.schemeCategory || "Schemes"}</p>
        </div>
      </section>

      <section className="admit-container admit-detail-section">
        <div className="admit-detail-grid">
          <article className="admit-detail-main">
            <div className="admit-detail-card">
              <h2>Scheme Details</h2>

              <div className="admit-info-grid">
                <div>
                  <strong>Category</strong>
                  <span>{scheme.schemeCategory || "-"}</span>
                </div>

                <div>
                  <strong>Department / Portal</strong>
                  <span>{scheme.department || "-"}</span>
                </div>

                <div>
                  <strong>Application Start Date</strong>
                  <span>{formatDate(scheme.startDate)}</span>
                </div>

                <div>
                  <strong>Last Date</strong>
                  <span>{formatDate(scheme.lastDate)}</span>
                </div>

                <div>
                  <strong>Benefit / Amount</strong>
                  <span>{scheme.benefit || "-"}</span>
                </div>
              </div>
            </div>

            <div className="admit-detail-card">
              <h2>Eligibility</h2>

              <div className="admit-description">
                {scheme.eligibility
                  ? scheme.eligibility
                      .split("\n")
                      .map((line, index) => <p key={index}>{line}</p>)
                  : "Eligibility details will be updated soon."}
              </div>
            </div>

            {scheme.importantDates && scheme.importantDates.length > 0 ? (
              <div className="admit-detail-card">
                <h2>Important Dates</h2>

                <div className="admit-info-grid">
                  {scheme.importantDates.map((item, index) => (
                    <div key={`${item.label}-${index}`}>
                      <strong>{item.label || "Date"}</strong>
                      <span>{formatDate(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="admit-detail-card">
              <h2>Description</h2>

              <div className="admit-description">
                {description
                  ? description
                      .split("\n")
                      .map((line, index) => <p key={index}>{line}</p>)
                  : "No description available."}
              </div>
            </div>

            {youtubeEmbedUrl ? (
              <div className="admit-detail-card">
                <h2>Video Guide</h2>

                <div className="admit-youtube-box">
                  <iframe
                    src={youtubeEmbedUrl}
                    title={name}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : null}
          </article>

          <aside className="admit-detail-sidebar">
            <div className="admit-detail-card">
              <h2>Important Links</h2>

              {importantLinks.length > 0 ? (
                <div className="admit-important-links">
                  {importantLinks.map((link, index) =>
                    link.url ? (
                      <a
                        key={`${link.label}-${index}`}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {link.label || "Open Link"}
                      </a>
                    ) : null
                  )}
                </div>
              ) : (
                <p>No links available.</p>
              )}
            </div>

            <div className="admit-detail-card">
              <h2>Share</h2>
              <p>Share this scheme update with your friends.</p>

<div className="admit-share-icons">
  <button
    type="button"
    className="admit-share-icon-btn admit-whatsapp-btn"
    onClick={() => openWhatsAppShare(name)}
    aria-label="Share on WhatsApp"
    title="Share on WhatsApp"
  >
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16.04 3C9.45 3 4.08 8.28 4.08 14.78c0 2.08.56 4.11 1.62 5.89L4 29l8.54-2.2a12.18 12.18 0 0 0 5.5 1.34C24.63 28.14 30 22.86 30 16.36S24.63 3 16.04 3Zm0 23.05c-1.75 0-3.46-.46-4.96-1.34l-.36-.21-5.06 1.3 1.34-4.86-.24-.39a9.76 9.76 0 0 1-1.5-5.17c0-5.35 4.82-10.29 10.78-10.29 5.95 0 10.78 4.94 10.78 10.29S21.99 26.05 16.04 26.05Zm5.91-7.72c-.32-.16-1.91-.93-2.2-1.04-.3-.11-.51-.16-.73.16-.21.32-.84 1.04-1.03 1.25-.19.21-.38.24-.7.08-.32-.16-1.36-.49-2.59-1.56-.96-.84-1.6-1.88-1.79-2.2-.19-.32-.02-.49.14-.65.15-.15.32-.38.49-.57.16-.19.21-.32.32-.54.11-.21.05-.4-.03-.56-.08-.16-.73-1.73-1-2.37-.26-.62-.53-.54-.73-.55h-.62c-.21 0-.56.08-.86.4-.3.32-1.13 1.09-1.13 2.66s1.16 3.09 1.32 3.3c.16.21 2.28 3.43 5.54 4.81.77.33 1.38.53 1.85.68.78.24 1.49.21 2.05.13.63-.09 1.91-.77 2.18-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.62-.37Z" />
    </svg>
  </button>

  <button
    type="button"
    className="admit-share-icon-btn admit-telegram-btn"
    onClick={() => openTelegramShare(name)}
    aria-label="Share on Telegram"
    title="Share on Telegram"
  >
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M28.73 5.16 24.47 26.1c-.32 1.49-1.16 1.86-2.35 1.16l-6.5-4.79-3.14 3.02c-.35.35-.64.64-1.31.64l.47-6.63L23.7 8.6c.52-.47-.11-.73-.81-.26L7.98 17.73 1.56 15.72c-1.39-.44-1.42-1.39.29-2.06L26.97 4c1.16-.44 2.18.27 1.76 1.16Z" />
    </svg>
  </button>
</div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}