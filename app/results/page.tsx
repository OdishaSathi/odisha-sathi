"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

const RESULT_SUB_CATEGORIES = [
  "Odisha Results",
  "Central Results",
  "Board Results",
  "University Results",
  "Entrance Results",
  "Recruitment Results",
  "10th Results",
  "+2 Results",
  "+3 Results",
  "Other Results",
];

const RESULT_COLLECTIONS = ["posts", "results", "result"];

const POSTS_PER_PAGE = 30;
const LATEST_STACK_COUNT = 8;

type ImportantDate = {
  label?: string;
  value?: string;
};

type ResultPost = {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  category?: string;
  subCategory?: string;
  subCategories?: string[];
  examName?: string;
  postName?: string;
  department?: string;
  organization?: string;
  resultDate?: string;
  resultDateDisplay?: string;
  publishedDate?: string;
  importantDates?: ImportantDate[];
  createdAt?: any;
  sourceCollection?: string;
};

function getTimeValue(item: ResultPost) {
  return item.createdAt?.seconds || 0;
}

function parseDateValue(value?: any) {
  if (!value) return null;

  if (typeof value === "object" && typeof value.seconds === "number") {
    const date = new Date(value.seconds * 1000);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  if (typeof value !== "string") return null;

  const cleanValue = value.trim();
  if (!cleanValue) return null;

  const ddMmYyyy = cleanValue.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);

  if (ddMmYyyy) {
    const day = Number(ddMmYyyy[1]);
    const month = Number(ddMmYyyy[2]);
    const year = Number(ddMmYyyy[3]);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const yyyyMmDd = cleanValue.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);

  if (yyyyMmDd) {
    const year = Number(yyyyMmDd[1]);
    const month = Number(yyyyMmDd[2]);
    const day = Number(yyyyMmDd[3]);
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  const date = new Date(cleanValue);

  if (Number.isNaN(date.getTime())) return null;

  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(value?: any) {
  if (!value) return "";

  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return typeof value === "string" ? value.trim() : "";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPublishedDate(item: ResultPost) {
  return formatDate(item.createdAt || item.publishedDate);
}

function getRawResultDate(item: ResultPost) {
  if (item.resultDateDisplay) return item.resultDateDisplay;
  if (item.resultDate) return item.resultDate;

  const matchedDate = item.importantDates?.find((dateItem) => {
    const label = (dateItem.label || "").toLowerCase();

    return (
      label.includes("result") ||
      label.includes("declaration") ||
      label.includes("declared") ||
      label.includes("publish")
    );
  });

  return matchedDate?.value || "";
}

function getResultDate(item: ResultPost) {
  return formatDate(getRawResultDate(item));
}

function getResultMeta(item: ResultPost) {
  return (
    item.examName ||
    item.postName ||
    item.department ||
    item.organization ||
    "Result details available"
  );
}

function isResultPost(item: ResultPost) {
  const category = (item.category || "").toLowerCase().trim();
  const sourceCollection = (item.sourceCollection || "").toLowerCase().trim();

  return (
    sourceCollection === "results" ||
    sourceCollection === "result" ||
    category === "results" ||
    category === "result"
  );
}

function getResultKey(item: ResultPost) {
  return item.slug || item.id;
}

function LatestResultStack({
  result,
  index,
}: {
  result: ResultPost;
  index: number;
}) {
  const resultDate = getResultDate(result);
  const publishedDate = getPublishedDate(result);
  const metaText = getResultMeta(result);

  return (
    <Link
      href={`/post/${result.slug || result.id}`}
      className={`os-result-stack-card os-result-stack-color-${index % 8}`}
    >
      <h3>{result.title || "Untitled Result"}</h3>

      <p>{metaText}</p>

      <div className="os-result-stack-date-row">
        {resultDate ? (
          <span className="os-result-date">Result Date - {resultDate}</span>
        ) : null}

        {publishedDate ? (
          <span className="os-result-published">
            Published - {publishedDate}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function AllResultItem({ result }: { result: ResultPost }) {
  const publishedDate = getPublishedDate(result);

  return (
    <Link
      href={`/post/${result.slug || result.id}`}
      className="os-all-result-item"
    >
      <h3>{result.title || "Untitled Result"}</h3>

      {publishedDate ? (
        <span>Published: {publishedDate}</span>
      ) : (
        <span>Published date not available</span>
      )}
    </Link>
  );
}

export default function ResultsPage() {
  const [results, setResults] = useState<ResultPost[]>([]);
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [loading, setLoading] = useState(true);

  const latestResults = results.slice(0, LATEST_STACK_COUNT);
  const visibleResults = results.slice(0, visibleCount);
  const canViewMore = visibleCount < results.length;

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);

        const allResults: ResultPost[] = [];

        for (const collectionName of RESULT_COLLECTIONS) {
          const snapshot = await getDocs(collection(db, collectionName));

          snapshot.docs.forEach((docItem) => {
            const data = docItem.data();

            allResults.push({
              id: docItem.id,
              title: data.title || "",
              slug: data.slug || "",
              content: data.content || data.description || "",
              category: data.category || "",
              subCategory: data.subCategory || "",
              subCategories: Array.isArray(data.subCategories)
                ? data.subCategories
                : data.subCategory
                ? [data.subCategory]
                : [],
              examName: data.examName || data.exam || "",
              postName: data.postName || data.resultPostName || data.post || "",
              department: data.department || "",
              organization: data.organization || "",
              resultDate:
                data.resultDate ||
                data.resultDeclarationDate ||
                data.resultDeclaredDate ||
                "",
              resultDateDisplay:
                data.resultDateDisplay ||
                data.resultDisplayDate ||
                data.displayResultDate ||
                "",
              publishedDate: data.publishedDate || "",
              importantDates: data.importantDates || [],
              createdAt: data.createdAt || null,
              sourceCollection: collectionName,
            });
          });
        }

        const uniqueResults = Array.from(
          new Map(
            allResults
              .filter((item) => isResultPost(item))
              .map((item) => [getResultKey(item), item])
          ).values()
        ).sort((a, b) => getTimeValue(b) - getTimeValue(a));

        setResults(uniqueResults);
        setVisibleCount(POSTS_PER_PAGE);
      } catch (error) {
        console.error(error);
        alert("Failed to load results");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  return (
    <main className="os-list-page">
      <div className="os-list-container">
        <section className="os-list-top">
          <p>ODISHA SATHI RESULTS  (Find all the result updates in this page)</p>
        </section>

        <section className="os-results-layout">
          <div className="os-results-main">
            <section className="os-list-section">
              <div className="os-list-section-head">
                <h2>Latest Results</h2>
              </div>

              {loading ? (
                <p className="os-list-status">Loading results...</p>
              ) : latestResults.length === 0 ? (
                <p className="os-list-status">No results found.</p>
              ) : (
                <div className="os-result-stack-grid">
                  {latestResults.map((result, index) => (
                    <LatestResultStack
                      key={result.id}
                      result={result}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="os-list-section">
              <div className="os-list-section-head">
                <h2>All Results</h2>
              </div>

              {loading ? (
                <p className="os-list-status">Loading results...</p>
              ) : results.length === 0 ? (
                <p className="os-list-status">No results found.</p>
              ) : (
                <>
                  <div className="os-all-result-grid">
                    {visibleResults.map((result) => (
                      <AllResultItem key={result.id} result={result} />
                    ))}
                  </div>

                  {canViewMore ? (
                    <div className="os-view-more-wrap">
                      <button
                        type="button"
                        className="os-view-more-btn"
                        onClick={() =>
                          setVisibleCount((current) => current + POSTS_PER_PAGE)
                        }
                      >
                        View More
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          </div>

          <aside className="os-results-sidebar">
            <section className="os-side-card">
              <h2>Result Categories</h2>

              <div className="os-side-category-list">
                {RESULT_SUB_CATEGORIES.map((item) => (
                  <Link key={item} href={`/results/${encodeURIComponent(item)}`}>
                    {item}
                  </Link>
                ))}
              </div>
            </section>

            <section className="os-side-card">
              <h2>Quick Access</h2>

              <Link href="/jobs">Latest Jobs</Link>
              <Link href="/results">Results</Link>
              <Link href="/admissions">Admissions</Link>
              <Link href="/admit-cards">Admit Cards & Exams</Link>
              <Link href="/schemes">Schemes</Link>
              <Link href="/tools">Tools</Link>
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
          margin: 0;
          color: #c2410c;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .os-results-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 18px;
          align-items: start;
        }

        .os-results-main {
          display: grid;
          gap: 16px;
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

        .os-result-stack-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          padding: 14px;
        }

        .os-result-stack-card {
          min-height: 112px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 8px;
          padding: 14px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 10px;
          text-decoration: none;
          color: #0f172a;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease;
        }

        .os-result-stack-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.09);
        }

        .os-result-stack-card h3 {
          margin: 0;
          color: #0f172a;
          font-size: 14.5px;
          line-height: 1.3;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .os-result-stack-card p {
          margin: 0;
          color: #1f2937;
          font-size: 13px;
          line-height: 1.35;
          font-weight: 800;
        }

        .os-result-stack-date-row {
          display: grid;
          gap: 4px;
          margin-top: auto;
        }

        .os-result-stack-date-row span {
          font-size: 12px;
          line-height: 1.2;
          font-weight: 900;
        }

        .os-result-date {
          color: #166534;
        }

        .os-result-published {
          color: #334155;
        }

        .os-result-stack-color-0 {
          background: linear-gradient(135deg, #fff7ed, #fed7aa);
        }

        .os-result-stack-color-1 {
          background: linear-gradient(135deg, #eff6ff, #bfdbfe);
        }

        .os-result-stack-color-2 {
          background: linear-gradient(135deg, #ecfdf5, #86efac);
        }

        .os-result-stack-color-3 {
          background: linear-gradient(135deg, #fff1f2, #fecdd3);
        }

        .os-result-stack-color-4 {
          background: linear-gradient(135deg, #f5f3ff, #ddd6fe);
        }

        .os-result-stack-color-5 {
          background: linear-gradient(135deg, #fefce8, #fde68a);
        }

        .os-result-stack-color-6 {
          background: linear-gradient(135deg, #ecfeff, #a5f3fc);
        }

        .os-result-stack-color-7 {
          background: linear-gradient(135deg, #fdf2f8, #fbcfe8);
        }

        .os-all-result-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          border-top: 1px solid #f1f5f9;
        }

        .os-all-result-item {
          min-height: 62px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          flex-direction: column;
          gap: 5px;
          padding: 12px 14px;
          text-decoration: none;
          color: inherit;
          background: #ffffff;
          border-right: 1px solid #f1f5f9;
          border-bottom: 1px solid #f1f5f9;
          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        .os-all-result-item:nth-child(2n) {
          border-right: none;
        }

        .os-all-result-item:hover {
          background: #fff7ed;
        }

        .os-all-result-item h3 {
          margin: 0;
          color: #1d4ed8;
          font-size: 14px;
          line-height: 1.35;
          font-weight: 900;
          letter-spacing: -0.01em;
        }

        .os-all-result-item:hover h3 {
          color: #ea580c;
        }

        .os-all-result-item span {
          color: #64748b;
          font-size: 12px;
          line-height: 1.2;
          font-weight: 800;
        }

        .os-list-status {
          margin: 0;
          padding: 14px 16px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 600;
        }

        .os-view-more-wrap {
          display: flex;
          justify-content: center;
          padding: 16px;
          border-top: 1px solid #f1f5f9;
          background: #ffffff;
        }

        .os-view-more-btn {
          min-width: 150px;
          min-height: 42px;
          padding: 10px 22px;
          border: none;
          border-radius: 999px;
          background: #0b63ce;
          color: #ffffff;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 8px 18px rgba(37, 99, 235, 0.18);
          transition:
            transform 0.18s ease,
            background 0.18s ease,
            box-shadow 0.18s ease;
        }

        .os-view-more-btn:hover {
          background: #e85d04;
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(232, 93, 4, 0.2);
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
          transition:
            color 0.15s ease,
            background 0.15s ease;
        }

        .os-side-card a:last-child {
          border-bottom: none;
        }

        .os-side-card a:hover {
          color: #ea580c;
          text-decoration: underline;
        }

        .os-side-category-list {
          display: grid;
        }

        .os-side-category-list a {
          border-radius: 10px;
          padding: 10px 8px;
        }

        .os-side-category-list a:hover {
          background: #fff7ed;
          text-decoration: none;
        }

        @media (max-width: 1000px) {
          .os-result-stack-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .os-list-container {
            width: min(100% - 24px, 1180px);
            padding-top: 18px;
          }

          .os-list-top p {
            font-size: 12px;
          }

          .os-results-layout {
            grid-template-columns: 1fr;
          }

          .os-results-sidebar {
            position: static;
          }

          .os-list-section-head {
            padding: 13px 14px;
          }

          .os-view-more-wrap {
            padding: 14px;
          }

          .os-view-more-btn {
            width: 100%;
          }
        }

        @media (max-width: 620px) {
          .os-result-stack-grid {
            grid-template-columns: 1fr;
            padding: 12px;
          }

          .os-all-result-grid {
            grid-template-columns: 1fr;
          }

          .os-all-result-item {
            border-right: none;
          }

          .os-result-stack-card {
            min-height: 104px;
          }
        }
      `}</style>
    </main>
  );
}