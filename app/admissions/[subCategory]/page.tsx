"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

type ImportantDate = {
  label?: string;
  value?: string;
};

type ImportantLink = {
  label?: string;
  url?: string;
};

type AdmissionPost = {
  id: string;
  title?: string;
  slug?: string;
  department?: string;
  admissionCategory?: string;
  applicationStartDate?: string;
  lastDate?: string;
  meritListDate?: string;
  description?: string;
  content?: string;
  youtubeUrl?: string;
  youtubeLink?: string;
  videoUrl?: string;
  videoLink?: string;
  sharingImageUrl?: string;
  status?: string;
  published?: boolean;
  importantDates?: ImportantDate[];
  importantLinks?: ImportantLink[];
  links?: ImportantLink[];
};

function formatDate(dateValue?: string) {
  if (!dateValue) return "-";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function extractYouTubeVideoId(rawUrl?: string) {
  if (!rawUrl) return "";

  let value = rawUrl.trim();

  try {
    value = decodeURIComponent(value);
  } catch {
    // Keep original value
  }

  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{6,})/,
    /[?&]v=([a-zA-Z0-9_-]{6,})/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  try {
    const parsedUrl = new URL(rawUrl);
    const bingEncodedUrl = parsedUrl.searchParams.get("u");

    if (bingEncodedUrl) {
      const cleanedValue = bingEncodedUrl.startsWith("a1")
        ? bingEncodedUrl.slice(2)
        : bingEncodedUrl;

      if (typeof atob === "function") {
        const decodedValue = atob(
          cleanedValue.replace(/-/g, "+").replace(/_/g, "/")
        );

        return extractYouTubeVideoId(decodedValue);
      }
    }
  } catch {
    // Ignore invalid URL
  }

  return "";
}

function getYouTubeEmbedUrl(url?: string) {
  const videoId = extractYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
}

function getStatusText(status?: string) {
  return status === "closed" ? "Closed" : "Active";
}

function getStatusClass(status?: string) {
  return status === "closed" ? "not-released" : "released";
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

export default function AdmissionDetailsPage() {
  const params = useParams();
  const subCategoryParam = params?.subCategory;

  const subCategory = Array.isArray(subCategoryParam)
    ? subCategoryParam[0]
    : subCategoryParam;

  const [admission, setAdmission] = useState<AdmissionPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const youtubeSourceUrl =
    admission?.youtubeUrl ||
    admission?.youtubeLink ||
    admission?.videoUrl ||
    admission?.videoLink ||
    "";

  const youtubeEmbedUrl = useMemo(
    () => getYouTubeEmbedUrl(youtubeSourceUrl),
    [youtubeSourceUrl]
  );

  const importantLinks = useMemo(() => {
    if (admission?.importantLinks && admission.importantLinks.length > 0) {
      return admission.importantLinks;
    }

    if (admission?.links && admission.links.length > 0) {
      return admission.links;
    }

    return [];
  }, [admission?.importantLinks, admission?.links]);

  useEffect(() => {
    async function loadAdmission() {
      if (!subCategory) {
        setIsLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "posts"),
          where("category", "==", "admissions")
        );

        const snapshot = await getDocs(q);

        const allAdmissions = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<AdmissionPost, "id">),
        }));

        const matchedAdmission =
          allAdmissions.find((item) => item.slug === subCategory) ||
          allAdmissions.find((item) => item.id === subCategory) ||
          null;

        setAdmission(matchedAdmission);
      } catch (error) {
        console.error("Failed to load admission details:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAdmission();
  }, [subCategory]);

  if (isLoading) {
    return (
      <main className="admit-detail-page">
        <section className="admit-container admit-detail-section">
          <div className="admit-empty-box">
            <p>Loading admission details...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!admission || admission.published === false) {
    return (
      <main className="admit-detail-page">
        <section className="admit-container admit-detail-section">
          <div className="admit-empty-box">
            <h1>Admission Post Not Found</h1>
            <p>The admission update you are looking for is not available.</p>
            <Link className="admit-primary-btn" href="/admissions">
              Back to Admissions
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const title = admission.title || "Admission Update";
  const description = admission.description || admission.content || "";
  const statusText = getStatusText(admission.status);
  const statusClass = getStatusClass(admission.status);

  return (
    <main className="admit-detail-page">
      <section className="admit-detail-hero">
        <div className="admit-container">
          <Link className="admit-back-link" href="/admissions">
            ← Back to Admissions
          </Link>

          <span className={`admit-status-pill admit-status-${statusClass}`}>
            {statusText}
          </span>

          <h1>{title}</h1>
          <p>{admission.department || admission.admissionCategory || "-"}</p>
        </div>
      </section>

      <section className="admit-container admit-detail-section">
        <div className="admit-detail-grid">
          <article className="admit-detail-main">
            <div className="admit-detail-card">
              <h2>Admission Details</h2>

              <div className="admit-info-grid">
                <div>
                  <strong>Admission Category</strong>
                  <span>{admission.admissionCategory || "-"}</span>
                </div>

                <div>
                  <strong>Department / Board</strong>
                  <span>{admission.department || "-"}</span>
                </div>

                <div>
                  <strong>Application Start Date</strong>
                  <span>{formatDate(admission.applicationStartDate)}</span>
                </div>

                <div>
                  <strong>Last Date</strong>
                  <span>{formatDate(admission.lastDate)}</span>
                </div>
              </div>
            </div>

            {admission.importantDates && admission.importantDates.length > 0 ? (
              <div className="admit-detail-card">
                <h2>Important Dates</h2>

                <div className="admit-info-grid">
                  {admission.importantDates.map((item, index) => (
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
                    title={title}
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
              <p>Share this admission update with your friends.</p>

              <div className="admit-share-icons">
                <button
                  type="button"
                  className="admit-share-icon-btn admit-whatsapp-btn"
                  onClick={() => openWhatsAppShare(title)}
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
                  onClick={() => openTelegramShare(title)}
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