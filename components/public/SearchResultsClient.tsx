"use client";

import Link from "next/link";
import { parseReminderDate } from "@/lib/reminderUrgency";
import type { SearchResultRecord } from "@/lib/searchTypes";

type Props = {
  query: string;
  results: SearchResultRecord[];
};

function formatDate(value?: string | number) {
  if (!value) return "";

  if (typeof value === "number") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const parsed = parseReminderDate(value);
  if (!parsed) return String(value).trim();

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCategoryLabel(category?: string) {
  if (category === "jobs") return "Job";
  if (category === "results") return "Result";
  if (category === "admissions") return "Admission";
  if (category === "admit-cards") return "Admit Card & Exam";
  if (category === "citizen-services") return "Citizen Service";
  if (category === "schemes") return "Scheme";
  if (category === "important-information") return "Important Information";
  if (category === "pdf-tools") return "PDF Tools";
  if (category === "image-tools") return "Image Tools";
  if (category === "tools") return "Tool";
  return "Post";
}

function getDisplayTitle(post: SearchResultRecord) {
  return post.toolName || post.title || "Untitled Post";
}

function getPostLink(post: SearchResultRecord) {
  if (post.externalUrl) return post.externalUrl;

  if (post.category === "pdf-tools") return "/tools/pdf-tools";
  if (post.category === "image-tools") return "/tools/image-tools";
  if (post.category === "tools") {
    return post.toolCategory === "image-tools" ? "/tools/image-tools" : "/tools/pdf-tools";
  }

  const identifier = post.slug || post.id;

  if (post.category === "citizen-services") {
    return `/citizen-services/${identifier}`;
  }

  if (post.category === "important-information") {
    return `/important-information/${identifier}`;
  }

  return `/post/${identifier}`;
}

function getMatchedImportantDate(post: SearchResultRecord, words: string[]) {
  return (
    post.importantDates?.find((item) => {
      const label = `${item.label || ""} ${item.type || ""}`.toLowerCase();
      return words.some((word) => label.includes(word));
    })?.value || ""
  );
}

function getDateItems(post: SearchResultRecord) {
  const items: Array<{ label: string; value: string; className: string }> = [];

  const add = (label: string, value: string | undefined, className: string) => {
    const formatted = formatDate(value);
    if (!formatted || items.some((item) => item.label === label && item.value === formatted)) return;
    items.push({ label, value: formatted, className });
  };

  if (post.category === "results") {
    add(
      "Result",
      post.resultDate || getMatchedImportantDate(post, ["result", "merit", "declared"]),
      "os-date-start"
    );
  } else if (post.category === "admit-cards") {
    add(
      "Exam",
      post.examDate || getMatchedImportantDate(post, ["exam", "admit", "test"]),
      "os-date-start"
    );
    add(
      "Last",
      post.lastDate || getMatchedImportantDate(post, ["last", "closing", "deadline"]),
      "os-date-end"
    );
  } else if (post.category !== "tools" && post.category !== "pdf-tools" && post.category !== "image-tools") {
    add(
      "Start",
      post.startDate || getMatchedImportantDate(post, ["start", "opening", "begin"]),
      "os-date-start"
    );
    add(
      "Last",
      post.lastDate || getMatchedImportantDate(post, ["last", "closing", "deadline", "end"]),
      "os-date-end"
    );

    if (items.length === 0) {
      add(
        "Exam",
        post.examDate || getMatchedImportantDate(post, ["exam", "admit", "test"]),
        "os-date-start"
      );
      add(
        "Result",
        post.resultDate || getMatchedImportantDate(post, ["result", "merit", "declared"]),
        "os-date-start"
      );
    }
  }

  return items.slice(0, 2);
}

function getStatusLabel(post: SearchResultRecord) {
  const status = String(post.lifecycleStatus || post.status || "")
    .trim()
    .toLowerCase();

  if (!status || status === "published") return "";

  const labels: Record<string, string> = {
    upcoming: "Upcoming",
    scheduled: "Scheduled",
    open: "Open",
    "closing-soon": "Closing Soon",
    closingsoon: "Closing Soon",
    closed: "Closed",
    expired: "Closed",
    released: "Released",
    announced: "Announced",
  };

  return labels[status] || status.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getMeta(post: SearchResultRecord) {
  const text =
    post.organization ||
    post.department ||
    post.examName ||
    post.description ||
    (post.category === "tools" || post.category === "pdf-tools" || post.category === "image-tools"
      ? "Useful online tool."
      : "Click to read full update, important dates and useful links.");

  return text.length > 125 ? `${text.slice(0, 125)}...` : text;
}

function isExternalLink(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

function SearchResultRow({ post }: { post: SearchResultRecord }) {
  const href = getPostLink(post);
  const publishedDate = formatDate(post.createdAtMs);
  const dateItems = getDateItems(post);
  const statusLabel = getStatusLabel(post);

  const content = (
    <>
      <div className="os-search-row-content">
        <div className="os-search-title-line">
          <h3>{getDisplayTitle(post)}</h3>

          <div className="os-search-date-line">
            {publishedDate ? (
              <span className="os-date-published">Published: {publishedDate}</span>
            ) : null}

            {dateItems.map((item) => (
              <span key={`${item.label}-${item.value}`} className={item.className}>
                {item.label}: {item.value}
              </span>
            ))}
          </div>
        </div>

        <div className="os-search-tag-row">
          <span>{getCategoryLabel(post.category)}</span>
          {statusLabel ? <span>{statusLabel}</span> : null}
        </div>

        <p>{getMeta(post)}</p>
      </div>

      <span className="os-search-arrow">›</span>
    </>
  );

  if (isExternalLink(href)) {
    return (
      <a href={href} className="os-search-row" target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className="os-search-row">
      {content}
    </Link>
  );
}

export default function SearchResultsClient({ query, results }: Props) {
  return (
    <main className="os-search-page">
      <div className="os-search-container">
        <section className="os-search-top">
          <p>Odisha Sathi Search</p>
          <h1>Search Results</h1>
          <span>
            You searched for: <strong>{query || "No search keyword"}</strong>
          </span>
        </section>

        <section className="os-search-layout">
          <div className="os-search-main">
            <section className="os-search-section">
              <div className="os-search-section-head">
                <h2>Related Updates</h2>
                <span>{results.length} Found</span>
              </div>

              {!query.trim() ? (
                <p className="os-search-status">Please enter a search keyword.</p>
              ) : results.length === 0 ? (
                <p className="os-search-status">
                  No results found. Try a shorter job, exam, admission, scheme or service name.
                </p>
              ) : (
                <div className="os-search-board">
                  {results.map((post) => (
                    <SearchResultRow key={`${post.category}-${post.id}`} post={post} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="os-search-sidebar">
            <section className="os-side-card">
              <h2>Quick Access</h2>
              <Link href="/jobs">Latest Jobs</Link>
              <Link href="/results">Results</Link>
              <Link href="/admissions">Admissions</Link>
              <Link href="/admit-cards">Admit Cards & Exams</Link>
              <Link href="/citizen-services">Citizen Services</Link>
            </section>

            <section className="os-side-card os-side-note">
              <h2>Search Tips</h2>
              <p>
                Search by post name, qualification, exam, department, scholarship or citizen service.
              </p>
            </section>
          </aside>
        </section>
      </div>

      <style jsx global>{`
        .os-search-page {
          min-height: 100vh;
          background: #ffffff;
          color: #0f172a;
        }

        .os-search-container {
          width: min(100% - 32px, 1180px);
          margin: 0 auto;
          padding: 22px 0 42px;
        }

        .os-search-top {
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e5e7eb;
        }

        .os-search-top p {
          margin: 0 0 5px;
          color: #ea580c;
          font-size: 13px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .os-search-top h1 {
          margin: 0;
          color: #0f172a;
          font-size: 32px;
          line-height: 1.12;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .os-search-top span {
          display: block;
          margin-top: 6px;
          color: #475569;
          font-size: 14px;
          line-height: 1.45;
          font-weight: 700;
        }

        .os-search-top strong {
          color: #0f172a;
        }

        .os-search-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 18px;
          align-items: start;
        }

        .os-search-main {
          min-width: 0;
        }

        .os-search-section,
        .os-side-card {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          background: #ffffff;
        }

        .os-search-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .os-search-section-head h2,
        .os-side-card h2 {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: -0.025em;
        }

        .os-search-section-head span {
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
        }

        .os-search-board {
          display: grid;
        }

        .os-search-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
          padding: 13px 16px;
          text-decoration: none;
          color: inherit;
          background: #ffffff;
          border-bottom: 1px solid #f1f5f9;
        }

        .os-search-row:last-child {
          border-bottom: none;
        }

        .os-search-row:hover {
          background: #fff7ed;
        }

        .os-search-row-content {
          min-width: 0;
        }

        .os-search-title-line {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: start;
          gap: 12px;
        }

        .os-search-row h3 {
          margin: 0;
          color: #1d4ed8;
          font-size: 15.5px;
          line-height: 1.38;
          font-weight: 800;
          letter-spacing: -0.01em;
          transition: color 0.15s ease;
        }

        .os-search-row:hover h3,
        .os-search-row:hover .os-search-arrow {
          color: #ea580c;
        }

        .os-search-date-line {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 5px;
          max-width: 390px;
        }

        .os-search-date-line span {
          color: #475569;
          font-size: 12px;
          line-height: 1.2;
          font-weight: 800;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        .os-search-row:hover .os-date-start {
          color: #16a34a;
        }

        .os-search-row:hover .os-date-end {
          color: #dc2626;
        }

        .os-search-tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .os-search-tag-row span {
          display: inline-flex;
          width: fit-content;
          padding: 4px 8px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          font-size: 11px;
          line-height: 1;
          font-weight: 800;
        }

        .os-search-row p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 500;
        }

        .os-search-arrow {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
          font-size: 22px;
          line-height: 1;
          font-weight: 700;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .os-search-row:hover .os-search-arrow {
          background: #ffedd5;
        }

        .os-search-status {
          margin: 0;
          padding: 14px 16px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
        }

        .os-search-sidebar {
          display: grid;
          gap: 16px;
          position: sticky;
          top: 92px;
        }

        .os-side-card {
          padding: 15px;
        }

        .os-side-card h2 {
          margin-bottom: 12px;
          font-size: 17px;
        }

        .os-side-card a {
          display: block;
          padding: 10px 0;
          border-bottom: 1px solid #f1f5f9;
          color: #1d4ed8;
          text-decoration: none;
          font-size: 14px;
          font-weight: 800;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .os-side-card a:last-child {
          border-bottom: none;
        }

        .os-side-card a:hover {
          color: #ea580c;
          text-decoration: underline;
        }

        .os-side-note p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          font-weight: 500;
        }

        @media (max-width: 900px) {
          .os-search-container {
            width: min(100% - 24px, 1180px);
            padding-top: 18px;
          }

          .os-search-top h1 {
            font-size: 26px;
          }

          .os-search-top span {
            font-size: 13px;
          }

          .os-search-layout {
            grid-template-columns: 1fr;
          }

          .os-search-sidebar {
            position: static;
          }

          .os-search-row {
            padding: 13px 14px;
          }

          .os-search-title-line {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .os-search-date-line {
            justify-content: flex-start;
            max-width: 100%;
          }

          .os-search-row h3 {
            font-size: 15px;
          }

          .os-search-date-line span {
            font-size: 12px;
          }

          .os-search-row p {
            font-size: 12.8px;
          }

          .os-search-section-head {
            padding: 13px 14px;
          }
        }
      `}</style>
    </main>
  );
}
