"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

type ImportantDate = {
  label?: string;
  value?: string;
};

type AdmitCardPost = {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  content?: string;
  examName?: string;
  organization?: string;
  status?: string;
  startDate?: string;
  examDate?: string;
  admitCardDate?: string;
  releaseDate?: string;
  lastDate?: string;
  closingDate?: string;
  endDate?: string;
  importantDates?: ImportantDate[];
  createdAt?: any;
};

function getTimeValue(item: AdmitCardPost) {
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

function getPublishedDate(item: AdmitCardPost) {
  return formatDate(item.createdAt);
}

function getStartDate(item: AdmitCardPost) {
  const directDate =
    item.examDate ||
    item.admitCardDate ||
    item.releaseDate ||
    item.startDate ||
    "";

  if (directDate) {
    return formatDate(directDate);
  }

  const matchedDate = item.importantDates?.find((dateItem) => {
    const label = (dateItem.label || "").toLowerCase();

    return (
      label.includes("exam") ||
      label.includes("admit") ||
      label.includes("release") ||
      label.includes("start")
    );
  });

  return formatDate(matchedDate?.value);
}

function getLastDate(item: AdmitCardPost) {
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

function getMeta(item: AdmitCardPost) {
  const text =
    item.examName ||
    item.organization ||
    item.description ||
    item.content ||
    "Click to read admit card details, exam date and official download link.";

  return text.length > 105 ? `${text.slice(0, 105)}...` : text;
}

function AdmitCardItem({ item }: { item: AdmitCardPost }) {
  const publishedDate = getPublishedDate(item);
  const startDate = getStartDate(item);
  const lastDate = getLastDate(item);

  return (
    <Link
      href={`/admit-cards/${item.slug || item.id}`}
      className="os-admit-card-item"
    >
      <div className="os-admit-card-top">
        <span className="os-admit-badge">{item.status || "Updated"}</span>
        <span className="os-admit-arrow">›</span>
      </div>

      <h3>{item.title || "Untitled Admit Card"}</h3>

      <div className="os-admit-date-line">
        {publishedDate ? (
          <span className="os-date-published">Published: {publishedDate}</span>
        ) : null}

        {startDate ? (
          <span className="os-date-start">Exam/Start: {startDate}</span>
        ) : null}

        {lastDate ? <span className="os-date-end">Last: {lastDate}</span> : null}
      </div>

      <p>{getMeta(item)}</p>
    </Link>
  );
}

export default function AdmitCardsPage() {
  const [admitCards, setAdmitCards] = useState<AdmitCardPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdmitCards = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, "admitCards"));

        const admitCardList: AdmitCardPost[] = snapshot.docs
          .map((docItem) => {
            const data = docItem.data();

            return {
              id: docItem.id,
              title: data.title || "",
              slug: data.slug || "",
              description: data.description || "",
              content: data.content || "",
              examName: data.examName || "",
              organization: data.organization || data.department || "",
              status: data.status || "Updated",
              startDate:
                data.startDate ||
                data.examDate ||
                data.admitCardDate ||
                data.releaseDate ||
                data.applicationStartDate ||
                "",
              examDate: data.examDate || "",
              admitCardDate: data.admitCardDate || "",
              releaseDate: data.releaseDate || "",
              lastDate:
                data.lastDate ||
                data.applicationLastDate ||
                data.closingDate ||
                data.endDate ||
                "",
              closingDate: data.closingDate || "",
              endDate: data.endDate || "",
              importantDates: data.importantDates || [],
              createdAt: data.createdAt || null,
            };
          })
          .sort((a, b) => getTimeValue(b) - getTimeValue(a))
          .slice(0, 50);

        setAdmitCards(admitCardList);
      } catch (error) {
        console.error(error);
        alert("Failed to load admit cards");
      } finally {
        setLoading(false);
      }
    };

    loadAdmitCards();
  }, []);

  return (
    <main className="os-admit-page">
      <div className="os-admit-container">
        <section className="os-admit-top">
          <p>Odisha Sathi Admit Cards</p>
          <h1>Latest Admit Cards</h1>
          <span>
            Admit card updates, exam dates and official download links.
          </span>
        </section>

        <section className="os-admit-layout">
          <div className="os-admit-main">
            <section className="os-admit-section">
              <div className="os-admit-section-head">
                <h2>Recently Added Admit Cards</h2>
                <span>{admitCards.length} Updates</span>
              </div>

              {loading ? (
                <p className="os-admit-status">Loading admit cards...</p>
              ) : admitCards.length === 0 ? (
                <p className="os-admit-status">No admit cards found.</p>
              ) : (
                <div className="os-admit-card-grid">
                  {admitCards.map((item) => (
                    <AdmitCardItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="os-admit-sidebar">
            <section className="os-side-card">
              <h2>Quick Access</h2>

              <Link href="/jobs">Latest Jobs</Link>
              <Link href="/results">Results</Link>
              <Link href="/admissions">Admissions</Link>
              <Link href="/admit-cards">Admit Cards</Link>
              <Link href="/schemes">Schemes</Link>
              <Link href="/tools">Tools</Link>
            </section>
          </aside>
        </section>
      </div>

      <style jsx global>{`
        .os-admit-page {
          min-height: 100vh;
          background: #ffffff;
          color: #0f172a;
        }

        .os-admit-container {
          width: min(100% - 32px, 1180px);
          margin: 0 auto;
          padding: 22px 0 42px;
        }

        .os-admit-top {
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e5e7eb;
        }

        .os-admit-top p {
          margin: 0 0 5px;
          color: #ea580c;
          font-size: 13px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .os-admit-top h1 {
          margin: 0;
          color: #0f172a;
          font-size: 32px;
          line-height: 1.12;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .os-admit-top span {
          display: block;
          margin-top: 6px;
          color: #475569;
          font-size: 14px;
          line-height: 1.45;
          font-weight: 700;
        }

        .os-admit-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 18px;
          align-items: start;
        }

        .os-admit-main {
          min-width: 0;
        }

        .os-admit-section,
        .os-side-card {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          background: #ffffff;
        }

        .os-admit-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .os-admit-section-head h2,
        .os-side-card h2 {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: -0.025em;
        }

        .os-admit-section-head span {
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
        }

        .os-admit-card-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          padding: 14px;
        }

        .os-admit-card-item {
          min-width: 0;
          display: block;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #ffffff;
          padding: 14px;
          color: inherit;
          text-decoration: none;
          transition: background 0.15s ease, border-color 0.15s ease,
            transform 0.15s ease;
        }

        .os-admit-card-item:hover {
          background: #fff7ed;
          border-color: #fed7aa;
          transform: translateY(-1px);
        }

        .os-admit-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .os-admit-badge {
          display: inline-flex;
          width: fit-content;
          padding: 4px 8px;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          font-size: 11px;
          line-height: 1;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .os-admit-arrow {
          width: 26px;
          height: 26px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
          font-size: 21px;
          line-height: 1;
          font-weight: 700;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .os-admit-card-item h3 {
          margin: 0;
          color: #1d4ed8;
          font-size: 15.5px;
          line-height: 1.38;
          font-weight: 800;
          letter-spacing: -0.01em;
          transition: color 0.15s ease;
        }

        .os-admit-card-item:hover h3,
        .os-admit-card-item:hover .os-admit-arrow {
          color: #ea580c;
        }

        .os-admit-card-item:hover .os-admit-arrow {
          background: #ffedd5;
        }

        .os-admit-date-line {
          display: flex;
          flex-wrap: wrap;
          gap: 6px 10px;
          margin-top: 8px;
        }

        .os-admit-date-line span {
          color: #475569;
          font-size: 12px;
          line-height: 1.2;
          font-weight: 800;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        .os-admit-card-item:hover .os-date-start {
          color: #16a34a;
        }

        .os-admit-card-item:hover .os-date-end {
          color: #dc2626;
        }

        .os-admit-card-item p {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 500;
        }

        .os-admit-status {
          margin: 0;
          padding: 14px 16px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
        }

        .os-admit-sidebar {
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

        @media (max-width: 900px) {
          .os-admit-container {
            width: min(100% - 24px, 1180px);
            padding-top: 18px;
          }

          .os-admit-top h1 {
            font-size: 26px;
          }

          .os-admit-top span {
            font-size: 13px;
          }

          .os-admit-layout {
            grid-template-columns: 1fr;
          }

          .os-admit-sidebar {
            position: static;
          }

          .os-admit-card-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            padding: 12px;
          }

          .os-admit-card-item {
            padding: 13px;
          }

          .os-admit-card-item h3 {
            font-size: 15px;
          }

          .os-admit-date-line span {
            font-size: 12px;
          }

          .os-admit-card-item p {
            font-size: 12.8px;
          }

          .os-admit-section-head {
            padding: 13px 14px;
          }
        }
      `}</style>
    </main>
  );
}