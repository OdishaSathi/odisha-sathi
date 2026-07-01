"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getAdmitCardBySlug } from "@/lib/admitCards";
import { AdmitCard } from "@/types/admitCard";

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

function getYouTubeEmbedUrl(url?: string) {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      const videoId = parsedUrl.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }

    if (parsedUrl.hostname.includes("youtube.com")) {
      const videoId = parsedUrl.searchParams.get("v");

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      if (parsedUrl.pathname.includes("/embed/")) {
        return url;
      }
    }

    return "";
  } catch {
    return "";
  }
}

function statusClass(status: string) {
  return status.toLowerCase().replace(/\s+/g, "-");
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

export default function AdmitCardDetailsPage() {
  const params = useParams();
  const slug = params?.subCategory as string;

  const [admitCard, setAdmitCard] = useState<AdmitCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const youtubeEmbedUrl = useMemo(
    () => getYouTubeEmbedUrl(admitCard?.youtubeUrl),
    [admitCard?.youtubeUrl]
  );

  useEffect(() => {
    const loadAdmitCard = async () => {
      try {
        const data = await getAdmitCardBySlug(slug);
        setAdmitCard(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      loadAdmitCard();
    }
  }, [slug]);

  if (isLoading) {
    return (
      <main className="admit-detail-page">
        <section className="admit-container admit-detail-section">
          <div className="admit-empty-box">
            <p>Loading admit card details...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!admitCard) {
    return (
      <main className="admit-detail-page">
        <section className="admit-container admit-detail-section">
          <div className="admit-empty-box">
            <h1>Admit Card Not Found</h1>
            <p>The admit card update you are looking for is not available.</p>
            <Link className="admit-primary-btn" href="/admit-cards">
              Back to Admit Cards
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admit-detail-page">
      <section className="admit-detail-hero">
        <div className="admit-container">
          <Link className="admit-back-link" href="/admit-cards">
            ← Back to Admit Cards
          </Link>

          <span
            className={`admit-status-pill admit-status-${statusClass(
              admitCard.status
            )}`}
          >
            {admitCard.status}
          </span>

          <h1>{admitCard.title}</h1>
          <p>{admitCard.examName}</p>
        </div>
      </section>

      <section className="admit-container admit-detail-section">
        <div className="admit-detail-grid">
          <article className="admit-detail-main">
            <div className="admit-detail-card">
              <h2>Admit Card Details</h2>

              <div className="admit-info-grid">
                <div>
                  <strong>Exam Name</strong>
                  <span>{admitCard.examName || "-"}</span>
                </div>

                <div>
                  <strong>Organization</strong>
                  <span>{admitCard.organization || "-"}</span>
                </div>

                <div>
                  <strong>Admit Card Date</strong>
                  <span>{formatDate(admitCard.admitCardDate)}</span>
                </div>

                <div>
                  <strong>Exam Date</strong>
                  <span>{formatDate(admitCard.examDate)}</span>
                </div>
              </div>
            </div>

            <div className="admit-detail-card">
              <h2>Description</h2>
              <div className="admit-description">
                {admitCard.description
                  ? admitCard.description.split("\n").map((line, index) => (
                      <p key={index}>{line}</p>
                    ))
                  : "No description available."}
              </div>
            </div>

            {youtubeEmbedUrl && (
              <div className="admit-detail-card">
                <h2>Video Guide</h2>
                <div className="admit-youtube-box">
                  <iframe
                    src={youtubeEmbedUrl}
                    title={admitCard.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </article>

          <aside className="admit-detail-sidebar">
            <div className="admit-detail-card">
              <h2>Important Links</h2>

              {admitCard.links && admitCard.links.length > 0 ? (
                <div className="admit-important-links">
                  {admitCard.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              ) : (
                <p>No links available.</p>
              )}
            </div>

            <div className="admit-detail-card">
              <h2>Share</h2>
              <p>Share this admit card update with your friends.</p>

              <div className="admit-share-icons">
                <button
                  type="button"
                  className="admit-share-icon-btn admit-whatsapp-btn"
                  onClick={() => openWhatsAppShare(admitCard.title)}
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
                  onClick={() => openTelegramShare(admitCard.title)}
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