"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

type ImportantDate = {
  label?: string;
  value?: string;
};

type PostItem = {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  content?: string;
  schemeName?: string;
  department?: string;
  startDate?: string;
  applicationStartDate?: string;
  openingDate?: string;
  lastDate?: string;
  applicationLastDate?: string;
  applicationEndDate?: string;
  closingDate?: string;
  endDate?: string;
  importantDates?: ImportantDate[];
  createdAt?: any;
};

function getTimeValue(item: PostItem) {
  return item.createdAt?.seconds || 0;
}

function getTitle(item: PostItem) {
  if (item.category === "schemes") {
    return item.schemeName || item.title || "Untitled Scheme";
  }

  return item.title || "Untitled Update";
}

function getLabel(item: PostItem) {
  if (item.category === "jobs") return "Job";
  if (item.category === "results") return "Result";
  if (item.category === "admissions") return "Admission";
  if (item.category === "admit-cards") return "Admit Card";
  if (item.category === "schemes") return "Scheme";
  return "Update";
}

function getLink(item: PostItem) {
  if (item.category === "results") {
    return `/results/${item.slug || item.id}`;
  }

  if (item.category === "admit-cards") {
    return `/admit-cards/${item.slug || item.id}`;
  }

  if (item.category === "admissions") {
    return `/admissions/${item.slug || item.id}`;
  }

  if (item.category === "schemes") {
    return `/schemes/${item.id}`;
  }

  return `/post/${item.slug || item.id}`;
}

function getMeta(item: PostItem) {
  const text =
    item.department ||
    item.content ||
    "Click to read full update, important dates and useful links.";

  return text.length > 90 ? `${text.slice(0, 90)}...` : text;
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

function getPublishedDate(item: PostItem) {
  return formatDate(item.createdAt);
}

function getStartDate(item: PostItem) {
  const directDate =
    item.startDate || item.applicationStartDate || item.openingDate || "";

  if (directDate) {
    return formatDate(directDate);
  }

  const matchedDate = item.importantDates?.find((dateItem) => {
    const label = (dateItem.label || "").toLowerCase();

    return (
      label.includes("start") ||
      label.includes("opening") ||
      label.includes("begin")
    );
  });

  return formatDate(matchedDate?.value);
}

function getLastDate(item: PostItem) {
  const directDate =
    item.lastDate ||
    item.applicationLastDate ||
    item.applicationEndDate ||
    item.closingDate ||
    item.endDate ||
    "";

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

function UpdateRow({
  item,
  showBadge = false,
}: {
  item: PostItem;
  showBadge?: boolean;
}) {
  const publishedDate = getPublishedDate(item);
  const startDate = getStartDate(item);
  const lastDate = getLastDate(item);

  return (
    <Link href={getLink(item)} className="os-board-row">
      <div className="os-board-row-content">
        {showBadge ? (
          <span className="os-board-badge">{getLabel(item)}</span>
        ) : null}

        <div className="os-board-title-line">
          <h3>{getTitle(item)}</h3>

          <div className="os-board-date-line">
            {publishedDate ? (
              <span className="os-date-published">
                Published: {publishedDate}
              </span>
            ) : null}

            {startDate ? (
              <span className="os-date-start">Start: {startDate}</span>
            ) : null}

            {lastDate ? (
              <span className="os-date-end">Last: {lastDate}</span>
            ) : null}
          </div>
        </div>

        <p>{getMeta(item)}</p>
      </div>

      <span className="os-board-arrow">›</span>
    </Link>
  );
}

function UpdateSection({
  title,
  href,
  items,
  emptyText,
}: {
  title: string;
  href: string;
  items: PostItem[];
  emptyText: string;
}) {
  return (
    <section className="os-board-section">
      <div className="os-board-section-head">
        <h2>{title}</h2>
        <Link href={href}>View All</Link>
      </div>

      {items.length === 0 ? (
        <p className="os-board-empty">{emptyText}</p>
      ) : (
        <div className="os-board-list">
          {items.map((item) => (
            <UpdateRow key={`${item.category}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const [jobs, setJobs] = useState<PostItem[]>([]);
  const [results, setResults] = useState<PostItem[]>([]);
  const [admissions, setAdmissions] = useState<PostItem[]>([]);
  const [admitCards, setAdmitCards] = useState<PostItem[]>([]);
  const [schemes, setSchemes] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomePosts = async () => {
      try {
        setLoading(true);

        const [postsSnapshot, admitCardsSnapshot, resultsSnapshot] =
          await Promise.all([
            getDocs(collection(db, "posts")),
            getDocs(collection(db, "admitCards")),
            getDocs(collection(db, "results")),
          ]);

        const allPosts: PostItem[] = postsSnapshot.docs
          .map((docItem) => {
            const data = docItem.data();

            return {
              id: docItem.id,
              title: data.title || "",
              slug: data.slug || "",
              category: data.category || "",
              content: data.content || data.description || "",
              schemeName: data.schemeName || data.title || "",
              department: data.department || data.organization || "",
              startDate:
                data.startDate ||
                data.applicationStartDate ||
                data.applicationOpenDate ||
                data.openingDate ||
                "",
              applicationStartDate: data.applicationStartDate || "",
              openingDate: data.openingDate || "",
              lastDate:
                data.lastDate ||
                data.applicationLastDate ||
                data.applicationEndDate ||
                data.closingDate ||
                data.endDate ||
                "",
              applicationLastDate: data.applicationLastDate || "",
              applicationEndDate: data.applicationEndDate || "",
              closingDate: data.closingDate || "",
              endDate: data.endDate || "",
              importantDates: data.importantDates || [],
              createdAt: data.createdAt || null,
            };
          })
          .filter(
            (item) =>
              item.category !== "scheme-category" &&
              item.category !== "tools" &&
              item.category !== ""
          )
          .sort((a, b) => getTimeValue(b) - getTimeValue(a));

        const allAdmitCards: PostItem[] = admitCardsSnapshot.docs
          .map((docItem) => {
            const data = docItem.data();

            return {
              id: docItem.id,
              title: data.title || "",
              slug: data.slug || "",
              category: "admit-cards",
              content: data.description || "",
              startDate:
                data.startDate ||
                data.examDate ||
                data.applicationStartDate ||
                data.openingDate ||
                "",
              applicationStartDate: data.applicationStartDate || "",
              openingDate: data.openingDate || "",
              lastDate:
                data.lastDate ||
                data.applicationLastDate ||
                data.applicationEndDate ||
                data.closingDate ||
                data.endDate ||
                "",
              importantDates: data.importantDates || [],
              createdAt: data.createdAt || null,
            };
          })
          .sort((a, b) => getTimeValue(b) - getTimeValue(a));

        const allResults: PostItem[] = resultsSnapshot.docs
          .map((docItem) => {
            const data = docItem.data();

            return {
              id: docItem.id,
              title: data.title || "",
              slug: data.slug || "",
              category: "results",
              content: data.description || "",
              startDate:
                data.startDate ||
                data.resultDate ||
                data.applicationStartDate ||
                data.openingDate ||
                "",
              applicationStartDate: data.applicationStartDate || "",
              openingDate: data.openingDate || "",
              lastDate:
                data.lastDate ||
                data.applicationLastDate ||
                data.applicationEndDate ||
                data.closingDate ||
                data.endDate ||
                "",
              importantDates: data.importantDates || [],
              createdAt: data.createdAt || null,
            };
          })
          .sort((a, b) => getTimeValue(b) - getTimeValue(a));

        setJobs(allPosts.filter((item) => item.category === "jobs").slice(0, 6));

        setResults(allResults.slice(0, 6));

        setAdmissions(
          allPosts.filter((item) => item.category === "admissions").slice(0, 6)
        );

        setAdmitCards(allAdmitCards.slice(0, 6));

        setSchemes(
          allPosts.filter((item) => item.category === "schemes").slice(0, 6)
        );
      } catch (error) {
        console.error(error);
        alert("Failed to load homepage updates");
      } finally {
        setLoading(false);
      }
    };

    loadHomePosts();
  }, []);

  const latestPosts = useMemo(() => {
    return [...jobs, ...results, ...admissions, ...admitCards, ...schemes]
      .sort((a, b) => getTimeValue(b) - getTimeValue(a))
      .slice(0, 3);
  }, [jobs, results, admissions, admitCards, schemes]);

  return (
    <main className="os-board-home">
      <div className="os-board-container">
        <section className="os-board-top">
          <div>
            <p className="os-board-kicker">Odisha Sathi Updates</p>
            <h1>jobs, results, admissions, admit cards and schemes</h1>
          </div>
        </section>

        {loading ? (
          <div className="os-board-loading">Loading latest updates...</div>
        ) : (
          <>
            <section className="os-board-latest">
              <div className="os-board-section-head os-board-latest-head">
                <h2>Latest Posts</h2>
              </div>

              <div className="os-board-list">
                {latestPosts.length === 0 ? (
                  <p className="os-board-empty">No latest posts available.</p>
                ) : (
                  latestPosts.map((item) => (
                    <UpdateRow
                      key={`latest-${item.category}-${item.id}`}
                      item={item}
                      showBadge
                    />
                  ))
                )}
              </div>
            </section>

            <section className="os-board-layout">
              <div className="os-board-main">
                <UpdateSection
                  title="Latest Jobs"
                  href="/jobs"
                  items={jobs}
                  emptyText="No jobs added yet."
                />

                <UpdateSection
                  title="Latest Results"
                  href="/results"
                  items={results}
                  emptyText="No results added yet."
                />

                <UpdateSection
                  title="Latest Admissions"
                  href="/admissions"
                  items={admissions}
                  emptyText="No admissions added yet."
                />

                <UpdateSection
                  title="Latest Admit Cards"
                  href="/admit-cards"
                  items={admitCards}
                  emptyText="No admit cards added yet."
                />

                <UpdateSection
                  title="Government Schemes"
                  href="/schemes"
                  items={schemes}
                  emptyText="No schemes added yet."
                />
              </div>

              <aside className="os-board-sidebar">
                <div className="os-side-card">
                  <h2>Quick Access</h2>

                  <Link href="/jobs">Latest Jobs</Link>
                  <Link href="/results">Results</Link>
                  <Link href="/admissions">Admissions</Link>
                  <Link href="/admit-cards">Admit Cards</Link>
                  <Link href="/schemes">Schemes</Link>
                  <Link href="/tools">Tools</Link>
                </div>

                <div className="os-side-card os-side-note">
                  <h2>Stay Updated</h2>
                  <p>
                    Bookmark Odisha Sathi for regular updates on Odisha jobs,
                    exams, admissions and schemes.
                  </p>
                </div>
              </aside>
            </section>
          </>
        )}
      </div>

      <style jsx global>{`
        .os-board-home {
          min-height: 100vh;
          background: #ffffff;
          color: #0f172a;
        }

        .os-board-container {
          width: min(100% - 32px, 1180px);
          margin: 0 auto;
          padding: 22px 0 42px;
        }

        .os-board-top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

.os-board-top > div {
  min-width: 0;
  width: 100%;
}

        .os-board-kicker {
          margin: 0 0 5px;
          color: #ea580c;
          font-size: 13px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .os-board-top h1 {
          margin: 0;
          max-width: 100%;
          color: #475569;
          font-size: 14px;
          line-height: 1.35;
          font-weight: 700;
          letter-spacing: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .os-board-loading {
          padding: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          color: #64748b;
          font-size: 15px;
          background: #ffffff;
        }

        .os-board-latest {
          margin-bottom: 18px;
          border: 1px solid #dbeafe;
          border-radius: 16px;
          overflow: hidden;
          background: #ffffff;
        }

        .os-board-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 18px;
          align-items: start;
        }

        .os-board-main {
          display: grid;
          gap: 16px;
        }

        .os-board-section,
        .os-side-card {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          background: #ffffff;
        }

        .os-board-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .os-board-latest-head {
          background: #f8fbff;
        }

        .os-board-section-head h2,
        .os-side-card h2 {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: -0.025em;
        }

        .os-board-section-head a {
          color: #2563eb;
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        .os-board-section-head a:hover {
          color: #ea580c;
          text-decoration: underline;
        }

        .os-board-list {
          display: grid;
        }

        .os-board-row {
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

        .os-board-row:last-child {
          border-bottom: none;
        }

        .os-board-row:hover {
          background: #fff7ed;
        }

        .os-board-row:hover h3,
        .os-board-row:hover .os-board-arrow {
          color: #ea580c;
        }

        .os-board-row-content {
          min-width: 0;
        }

        .os-board-badge {
          display: inline-flex;
          width: fit-content;
          margin-bottom: 7px;
          padding: 4px 8px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 11px;
          line-height: 1;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .os-board-title-line {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: start;
          gap: 12px;
        }

        .os-board-row h3 {
          margin: 0;
          color: #1d4ed8;
          font-size: 15.5px;
          line-height: 1.38;
          font-weight: 800;
          letter-spacing: -0.01em;
          transition: color 0.15s ease;
        }

        .os-board-date-line {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 5px;
          max-width: 390px;
        }

        .os-board-date-line span {
          color: #475569;
          font-size: 12px;
          line-height: 1.2;
          font-weight: 800;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        .os-board-row:hover .os-date-start {
          color: #16a34a;
        }

        .os-board-row:hover .os-date-end {
          color: #dc2626;
        }

        .os-board-row p {
          margin: 5px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 500;
        }

        .os-board-arrow {
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

        .os-board-row:hover .os-board-arrow {
          background: #ffedd5;
        }

        .os-board-empty {
          margin: 0;
          padding: 14px 16px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
        }

        .os-board-sidebar {
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
          transition: color 0.15s ease;
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
          .os-board-container {
            width: min(100% - 24px, 1180px);
            padding-top: 18px;
          }

          .os-board-layout {
            grid-template-columns: 1fr;
          }

          .os-board-sidebar {
            position: static;
          }

          .os-board-top h1 {
  font-size: 12.5px;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

          .os-board-row {
            padding: 13px 14px;
          }

          .os-board-title-line {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .os-board-date-line {
            justify-content: flex-start;
            max-width: 100%;
          }

          .os-board-row h3 {
            font-size: 15px;
          }

          .os-board-date-line span {
            font-size: 12px;
          }

          .os-board-row p {
            font-size: 12.8px;
          }

          .os-board-section-head {
            padding: 13px 14px;
          }
        }
      `}</style>
    </main>
  );
}