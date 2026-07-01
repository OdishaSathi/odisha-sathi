"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAllResults } from "@/lib/results";
import { ResultPost } from "@/types/result";

type ImportantDate = {
  label?: string;
  value?: string;
};

type ResultItem = ResultPost & {
  createdAt?: any;
  startDate?: string;
  resultDate?: string;
  lastDate?: string;
  closingDate?: string;
  endDate?: string;
  importantDates?: ImportantDate[];
};

function getTimeValue(item: ResultItem) {
  return item.createdAt?.seconds || 0;
}

function formatDate(value?: any) {
  if (!value) return "";

  if (typeof value === "object" && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  if (typeof value === "string") {
    const cleanValue = value.trim();

    if (!cleanValue) return "";

    const date = new Date(cleanValue);

    if (Number.isNaN(date.getTime())) {
      return cleanValue;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return "";
}

function statusClass(status?: string) {
  return (status || "updated").toLowerCase().replace(/\s+/g, "-");
}

function getPublishedDate(item: ResultItem) {
  return formatDate(item.createdAt);
}

function getStartDate(item: ResultItem) {
  const directDate = item.resultDate || item.startDate || "";

  if (directDate) {
    return formatDate(directDate);
  }

  const matchedDate = item.importantDates?.find((dateItem) => {
    const label = (dateItem.label || "").toLowerCase();

    return (
      label.includes("result") ||
      label.includes("start") ||
      label.includes("published") ||
      label.includes("declared")
    );
  });

  return formatDate(matchedDate?.value);
}

function getLastDate(item: ResultItem) {
  const directDate = item.lastDate || item.closingDate || item.endDate || "";

  if (directDate) {
    return formatDate(directDate);
  }

  const matchedDate = item.importantDates?.find((dateItem) => {
    const label = (dateItem.label || "").toLowerCase();

    return (
      label.includes("last") ||
      label.includes("closing") ||
      label.includes("end")
    );
  });

  return formatDate(matchedDate?.value);
}

function getMeta(item: ResultItem) {
  const text =
    item.examName ||
    item.organization ||
    item.description ||
    "Click to check result details, merit list, score card and official links.";

  return text.length > 110 ? `${text.slice(0, 110)}...` : text;
}

function ResultRow({ item }: { item: ResultItem }) {
  const publishedDate = getPublishedDate(item);
  const startDate = getStartDate(item);
  const lastDate = getLastDate(item);

  return (
    <Link href={`/results/${item.slug || item.id}`} className="os-list-row">
      <div className="os-list-row-content">
        <div className="os-list-title-line">
          <h3>{item.title || "Untitled Result"}</h3>

          <div className="os-list-date-line">
            {publishedDate ? (
              <span className="os-date-published">
                Published: {publishedDate}
              </span>
            ) : null}

            {startDate ? (
              <span className="os-date-start">Result: {startDate}</span>
            ) : null}

            {lastDate ? (
              <span className="os-date-end">Last: {lastDate}</span>
            ) : null}
          </div>
        </div>

        <div className="os-list-tag-row">
          <span className={`os-status-pill os-status-${statusClass(item.status)}`}>
            {item.status || "Updated"}
          </span>

          {item.organization ? <span>{item.organization}</span> : null}
        </div>

        <p>{getMeta(item)}</p>
      </div>

      <span className="os-list-arrow">›</span>
    </Link>
  );
}

export default function ResultsPage() {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const data = await getAllResults();

        const sortedData = (data as ResultItem[])
          .sort((a, b) => getTimeValue(b) - getTimeValue(a))
          .slice(0, 10);

        setResults(sortedData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, []);

  return (
    <main className="os-list-page">
      <div className="os-list-container">
        <section className="os-list-top">
          <p>Odisha Sathi Results</p>
          <h1>Latest Results</h1>
          <span>
            Exam results, merit lists, score cards and official result updates.
          </span>
        </section>

        <section className="os-results-layout">
          <div className="os-results-main">
            <section className="os-list-section">
              <div className="os-list-section-head">
                <h2>Recently Added Results</h2>
                <span>{results.length} Updates</span>
              </div>

              {isLoading ? (
                <p className="os-list-status">Loading results...</p>
              ) : results.length === 0 ? (
                <p className="os-list-status">
                  No result updates found. Please check again later.
                </p>
              ) : (
                <div className="os-list-board">
                  {results.map((item) => (
                    <ResultRow key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="os-results-sidebar">
            <section className="os-side-card">
              <h2>Quick Access</h2>

              <Link href="/jobs">Latest Jobs</Link>
              <Link href="/results">Results</Link>
              <Link href="/admissions">Admissions</Link>
              <Link href="/admit-cards">Admit Cards</Link>
              <Link href="/schemes">Schemes</Link>
              <Link href="/tools">Tools</Link>
            </section>

            <section className="os-side-card os-side-note">
              <h2>Result Updates</h2>
              <p>
                Check this page regularly for exam results, merit lists, score
                cards and official result links.
              </p>
            </section>
          </aside>
        </section>
      </div>

      <style jsx global>{`
        .os-list-page {
          min-height: 100vh;
          background: #ffffff;
          color: #0f172a;
        }

        .os-list-container {
          width: min(100% - 32px, 1180px);
          margin: 0 auto;
          padding: 22px 0 42px;
        }

        .os-list-top {
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e5e7eb;
        }

        .os-list-top p {
          margin: 0 0 5px;
          color: #ea580c;
          font-size: 13px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .os-list-top h1 {
          margin: 0;
          color: #0f172a;
          font-size: 32px;
          line-height: 1.12;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .os-list-top span {
          display: block;
          margin-top: 6px;
          color: #475569;
          font-size: 14px;
          line-height: 1.45;
          font-weight: 700;
        }

        .os-results-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 18px;
          align-items: start;
        }

        .os-results-main {
          min-width: 0;
        }

        .os-list-section,
        .os-side-card {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          background: #ffffff;
        }

        .os-list-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .os-list-section-head h2,
        .os-side-card h2 {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: -0.025em;
        }

        .os-list-section-head span {
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
        }

        .os-list-board {
          display: grid;
        }

        .os-list-row {
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

        .os-list-row:last-child {
          border-bottom: none;
        }

        .os-list-row:hover {
          background: #fff7ed;
        }

        .os-list-row-content {
          min-width: 0;
        }

        .os-list-title-line {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: start;
          gap: 12px;
        }

        .os-list-row h3 {
          margin: 0;
          color: #1d4ed8;
          font-size: 15.5px;
          line-height: 1.38;
          font-weight: 800;
          letter-spacing: -0.01em;
          transition: color 0.15s ease;
        }

        .os-list-row:hover h3,
        .os-list-row:hover .os-list-arrow {
          color: #ea580c;
        }

        .os-list-date-line {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 5px;
          max-width: 390px;
        }

        .os-list-date-line span {
          color: #475569;
          font-size: 12px;
          line-height: 1.2;
          font-weight: 800;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        .os-list-row:hover .os-date-start {
          color: #16a34a;
        }

        .os-list-row:hover .os-date-end {
          color: #dc2626;
        }

        .os-list-tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .os-list-tag-row span {
          display: inline-flex;
          width: fit-content;
          padding: 4px 8px;
          border-radius: 999px;
          background: #f8fafc;
          color: #475569;
          border: 1px solid #e2e8f0;
          font-size: 11px;
          line-height: 1;
          font-weight: 800;
        }

        .os-list-tag-row .os-status-pill {
          background: #eff6ff;
          color: #1d4ed8;
          border-color: #bfdbfe;
        }

        .os-list-row p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 500;
        }

        .os-list-arrow {
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

        .os-list-row:hover .os-list-arrow {
          background: #ffedd5;
        }

        .os-list-status {
          margin: 0;
          padding: 14px 16px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
        }

        .os-results-sidebar {
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
          .os-list-container {
            width: min(100% - 24px, 1180px);
            padding-top: 18px;
          }

          .os-list-top h1 {
            font-size: 26px;
          }

          .os-list-top span {
            font-size: 13px;
          }

          .os-results-layout {
            grid-template-columns: 1fr;
          }

          .os-results-sidebar {
            position: static;
          }

          .os-list-row {
            padding: 13px 14px;
          }

          .os-list-title-line {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .os-list-date-line {
            justify-content: flex-start;
            max-width: 100%;
          }

          .os-list-row h3 {
            font-size: 15px;
          }

          .os-list-date-line span {
            font-size: 12px;
          }

          .os-list-row p {
            font-size: 12.8px;
          }

          .os-list-section-head {
            padding: 13px 14px;
          }
        }
      `}</style>
    </main>
  );
}