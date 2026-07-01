"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

const ADMISSION_SUB_CATEGORIES = [
  "+2 Admission",
  "+3 Admission",
  "Diploma Admission",
  "ITI Admission",
  "B.Ed Admission",
  "Entrance Admission",
  "University Admission",
  "Other Admission",
];

type ImportantDate = {
  label?: string;
  value?: string;
};

type AdmissionPost = {
  id: string;
  title: string;
  slug?: string;
  content?: string;
  category?: string;
  subCategory?: string;
  subCategories?: string[];
  department?: string;
  organization?: string;
  institute?: string;
  board?: string;
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

function getTimeValue(item: AdmissionPost) {
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

function getPublishedDate(item: AdmissionPost) {
  return formatDate(item.createdAt);
}

function getStartDate(item: AdmissionPost) {
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

function getLastDate(item: AdmissionPost) {
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

function getMeta(item: AdmissionPost) {
  const text =
    item.institute ||
    item.board ||
    item.department ||
    item.organization ||
    item.content ||
    "Click to read admission details, important dates and official links.";

  return text.length > 110 ? `${text.slice(0, 110)}...` : text;
}

function AdmissionRow({ admission }: { admission: AdmissionPost }) {
  const publishedDate = getPublishedDate(admission);
  const startDate = getStartDate(admission);
  const lastDate = getLastDate(admission);

  return (
    <Link
      href={`/admissions/${admission.slug || admission.id}`}
      className="os-list-row"
    >
      <div className="os-list-row-content">
        <div className="os-list-title-line">
          <h3>{admission.title || "Untitled Admission"}</h3>

          <div className="os-list-date-line">
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

        {admission.subCategories && admission.subCategories.length > 0 ? (
          <div className="os-list-tag-row">
            {admission.subCategories.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}

        <p>{getMeta(admission)}</p>
      </div>

      <span className="os-list-arrow">›</span>
    </Link>
  );
}

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<AdmissionPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdmissions = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, "posts"));

        const admissionList: AdmissionPost[] = snapshot.docs
          .map((docItem) => {
            const data = docItem.data();

            return {
              id: docItem.id,
              title: data.title || "",
              slug: data.slug || "",
              content: data.content || data.description || data.shortDescription || "",
              category: data.category || "",
              subCategory: data.subCategory || "",
              subCategories: Array.isArray(data.subCategories)
                ? data.subCategories
                : data.subCategory
                ? [data.subCategory]
                : [],
              department: data.department || "",
              organization: data.organization || "",
              institute: data.institute || data.instituteName || "",
              board: data.board || data.boardName || "",
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
          .filter((item) => item.category === "admissions")
          .sort((a, b) => getTimeValue(b) - getTimeValue(a))
          .slice(0, 10);

        setAdmissions(admissionList);
      } catch (error) {
        console.error(error);
        alert("Failed to load admissions");
      } finally {
        setLoading(false);
      }
    };

    loadAdmissions();
  }, []);

  return (
    <main className="os-list-page">
      <div className="os-list-container">
        <section className="os-list-top">
          <p>Odisha Sathi Admissions</p>
          <h1>Latest Admissions</h1>
          <span>
            +2, +3, diploma, ITI, B.Ed, entrance and university admission updates.
          </span>
        </section>

        <section className="os-admissions-layout">
          <div className="os-admissions-main">
            <section className="os-list-section">
              <div className="os-list-section-head">
                <h2>Recently Added Admissions</h2>
                <span>{admissions.length} Updates</span>
              </div>

              {loading ? (
                <p className="os-list-status">Loading admissions...</p>
              ) : admissions.length === 0 ? (
                <p className="os-list-status">No admissions found.</p>
              ) : (
                <div className="os-list-board">
                  {admissions.map((admission) => (
                    <AdmissionRow key={admission.id} admission={admission} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="os-admissions-sidebar">
            <section className="os-side-card">
              <h2>Admission Categories</h2>

              <div className="os-side-category-list">
                {ADMISSION_SUB_CATEGORIES.map((item) => (
                  <Link
                    key={item}
                    href={`/admissions/${encodeURIComponent(item)}`}
                  >
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
              <Link href="/admit-cards">Admit Cards</Link>
              <Link href="/schemes">Schemes</Link>
              <Link href="/tools">Tools</Link>
            </section>

            <section className="os-side-card os-side-note">
              <h2>Admission Updates</h2>
              <p>
                Check this page regularly for admission dates, selection lists,
                official notices and important admission links.
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

        .os-admissions-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 18px;
          align-items: start;
        }

        .os-admissions-main {
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

        .os-admissions-sidebar {
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

          .os-admissions-layout {
            grid-template-columns: 1fr;
          }

          .os-admissions-sidebar {
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