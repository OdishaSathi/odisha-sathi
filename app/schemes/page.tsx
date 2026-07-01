"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

type ImportantDate = {
  label?: string;
  value?: string;
};

type SchemePost = {
  id: string;
  title?: string;
  schemeName?: string;
  department?: string;
  category?: string;
  schemeCategory?: string;
  schemeCategorySlug?: string;
  benefit?: string;
  startDate?: string;
  applicationStartDate?: string;
  openingDate?: string;
  lastDate?: string;
  applicationLastDate?: string;
  applicationEndDate?: string;
  closingDate?: string;
  endDate?: string;
  status?: string;
  importantDates?: ImportantDate[];
  createdAt?: any;
};

type SchemeCategory = {
  id: string;
  categoryName: string;
  slug: string;
};

function makeSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getTimeValue(item: SchemePost) {
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

function getPublishedDate(item: SchemePost) {
  return formatDate(item.createdAt);
}

function getStartDate(item: SchemePost) {
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

function getLastDate(item: SchemePost) {
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

function getMeta(item: SchemePost) {
  const text =
    item.department ||
    item.benefit ||
    "Click to read scheme details, eligibility, benefit and official links.";

  return text.length > 110 ? `${text.slice(0, 110)}...` : text;
}

function SchemeRow({ scheme }: { scheme: SchemePost }) {
  const name = scheme.schemeName || scheme.title || "Untitled Scheme";
  const publishedDate = getPublishedDate(scheme);
  const startDate = getStartDate(scheme);
  const lastDate = getLastDate(scheme);

  return (
    <Link href={`/schemes/${scheme.id}`} className="os-scheme-row">
      <div className="os-scheme-row-content">
        <div className="os-scheme-title-line">
          <h3>{name}</h3>

          <div className="os-scheme-date-line">
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

        <div className="os-scheme-tag-row">
          <span>{scheme.schemeCategory || "Government Schemes"}</span>

          <span
            className={
              scheme.status === "closed"
                ? "os-scheme-status closed"
                : "os-scheme-status active"
            }
          >
            {scheme.status === "closed" ? "Closed" : "Active"}
          </span>
        </div>

        <p>{getMeta(scheme)}</p>

        {scheme.benefit ? (
          <p className="os-scheme-benefit">Benefit: {scheme.benefit}</p>
        ) : null}
      </div>

      <span className="os-scheme-arrow">›</span>
    </Link>
  );
}

export default function SchemesPage() {
  const [schemes, setSchemes] = useState<SchemePost[]>([]);
  const [categories, setCategories] = useState<SchemeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchemes = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, "posts"));

        const allItems = snapshot.docs.map((docItem) => {
          const data = docItem.data();

          return {
            id: docItem.id,
            ...data,
          } as any;
        });

        const schemeList: SchemePost[] = allItems
          .filter(
            (item) => item.category === "schemes" && item.published !== false
          )
          .map((item) => {
            const schemeCategory = item.schemeCategory || "Government Schemes";

            return {
              id: item.id,
              title: item.title || "",
              schemeName: item.schemeName || item.title || "",
              department: item.department || "",
              category: item.category || "",
              schemeCategory,
              schemeCategorySlug:
                item.schemeCategorySlug || makeSlug(schemeCategory),
              benefit: item.benefit || item.amountBenefit || "",
              startDate:
                item.startDate ||
                item.applicationStartDate ||
                item.applicationOpenDate ||
                item.openingDate ||
                "",
              applicationStartDate: item.applicationStartDate || "",
              openingDate: item.openingDate || "",
              lastDate:
                item.lastDate ||
                item.applicationLastDate ||
                item.applicationEndDate ||
                item.closingDate ||
                item.endDate ||
                "",
              applicationLastDate: item.applicationLastDate || "",
              applicationEndDate: item.applicationEndDate || "",
              closingDate: item.closingDate || "",
              endDate: item.endDate || "",
              status: item.status || "active",
              importantDates: item.importantDates || [],
              createdAt: item.createdAt || null,
            };
          })
          .sort((a, b) => getTimeValue(b) - getTimeValue(a));

        const categoryDocs: SchemeCategory[] = allItems
          .filter(
            (item) =>
              item.category === "scheme-category" &&
              item.type === "scheme-category"
          )
          .map((item) => ({
            id: item.id,
            categoryName: item.categoryName || item.title || "",
            slug: item.slug || makeSlug(item.categoryName || item.title || ""),
          }))
          .filter((item) => item.categoryName && item.slug);

        const categoryFromPosts: SchemeCategory[] = schemeList.map((item) => ({
          id: item.schemeCategorySlug || makeSlug(item.schemeCategory || ""),
          categoryName: item.schemeCategory || "Government Schemes",
          slug: item.schemeCategorySlug || makeSlug(item.schemeCategory || ""),
        }));

        const mergedMap = new Map<string, SchemeCategory>();

        [...categoryDocs, ...categoryFromPosts].forEach((item) => {
          if (item.slug && !mergedMap.has(item.slug)) {
            mergedMap.set(item.slug, item);
          }
        });

        const mergedCategories = Array.from(mergedMap.values()).sort((a, b) =>
          a.categoryName.localeCompare(b.categoryName)
        );

        setSchemes(schemeList);
        setCategories(mergedCategories);
      } catch (error) {
        console.error(error);
        alert("Failed to load schemes");
      } finally {
        setLoading(false);
      }
    };

    loadSchemes();
  }, []);

  const filteredSchemes = useMemo(() => {
    if (selectedCategory === "all") {
      return schemes;
    }

    return schemes.filter(
      (scheme) => scheme.schemeCategorySlug === selectedCategory
    );
  }, [schemes, selectedCategory]);

  const selectedCategoryName =
    selectedCategory === "all"
      ? "Latest Schemes"
      : categories.find((item) => item.slug === selectedCategory)?.categoryName ||
        "Latest Schemes";

  return (
    <main className="os-scheme-page">
      <div className="os-scheme-container">
        <section className="os-scheme-top">
          <p>Odisha Sathi Schemes</p>
          <h1>Government Schemes</h1>
          <span>
            Government schemes, scholarships and public welfare updates with
            official links.
          </span>
        </section>

        <section className="os-scheme-layout">
          <div className="os-scheme-main">
            <section className="os-scheme-section">
              <div className="os-scheme-section-head">
                <h2>{selectedCategoryName}</h2>
                <span>{filteredSchemes.length} Updates</span>
              </div>

              {loading ? (
                <p className="os-scheme-status-text">Loading schemes...</p>
              ) : filteredSchemes.length === 0 ? (
                <p className="os-scheme-status-text">No schemes found.</p>
              ) : (
                <div className="os-scheme-board">
                  {filteredSchemes.map((scheme) => (
                    <SchemeRow key={scheme.id} scheme={scheme} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="os-scheme-sidebar">
            <section className="os-side-card">
              <h2>Scheme Categories</h2>

              <div className="os-side-category-list">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={selectedCategory === "all" ? "active" : ""}
                >
                  All Schemes
                </button>

                {categories.map((item) => (
                  <button
                    key={item.slug}
                    type="button"
                    onClick={() => setSelectedCategory(item.slug)}
                    className={selectedCategory === item.slug ? "active" : ""}
                  >
                    {item.categoryName}
                  </button>
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
              <h2>Scheme Updates</h2>
              <p>
                Check this page regularly for government schemes, scholarships,
                benefits, eligibility and official application links.
              </p>
            </section>
          </aside>
        </section>
      </div>

      <style jsx global>{`
        .os-scheme-page {
          min-height: 100vh;
          background: #ffffff;
          color: #0f172a;
        }

        .os-scheme-container {
          width: min(100% - 32px, 1180px);
          margin: 0 auto;
          padding: 22px 0 42px;
        }

        .os-scheme-top {
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e5e7eb;
        }

        .os-scheme-top p {
          margin: 0 0 5px;
          color: #ea580c;
          font-size: 13px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .os-scheme-top h1 {
          margin: 0;
          color: #0f172a;
          font-size: 32px;
          line-height: 1.12;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .os-scheme-top span {
          display: block;
          margin-top: 6px;
          color: #475569;
          font-size: 14px;
          line-height: 1.45;
          font-weight: 700;
        }

        .os-scheme-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 18px;
          align-items: start;
        }

        .os-scheme-main {
          min-width: 0;
        }

        .os-scheme-section,
        .os-side-card {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          background: #ffffff;
        }

        .os-scheme-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .os-scheme-section-head h2,
        .os-side-card h2 {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: -0.025em;
        }

        .os-scheme-section-head span {
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
          white-space: nowrap;
        }

        .os-scheme-board {
          display: grid;
        }

        .os-scheme-row {
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

        .os-scheme-row:last-child {
          border-bottom: none;
        }

        .os-scheme-row:hover {
          background: #fff7ed;
        }

        .os-scheme-row-content {
          min-width: 0;
        }

        .os-scheme-title-line {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: start;
          gap: 12px;
        }

        .os-scheme-row h3 {
          margin: 0;
          color: #1d4ed8;
          font-size: 15.5px;
          line-height: 1.38;
          font-weight: 800;
          letter-spacing: -0.01em;
          transition: color 0.15s ease;
        }

        .os-scheme-row:hover h3,
        .os-scheme-row:hover .os-scheme-arrow {
          color: #ea580c;
        }

        .os-scheme-date-line {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 5px;
          max-width: 390px;
        }

        .os-scheme-date-line span {
          color: #475569;
          font-size: 12px;
          line-height: 1.2;
          font-weight: 800;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        .os-scheme-row:hover .os-date-start {
          color: #16a34a;
        }

        .os-scheme-row:hover .os-date-end {
          color: #dc2626;
        }

        .os-scheme-tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }

        .os-scheme-tag-row span {
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

        .os-scheme-tag-row .os-scheme-status.active {
          background: #dcfce7;
          color: #15803d;
          border-color: #bbf7d0;
        }

        .os-scheme-tag-row .os-scheme-status.closed {
          background: #fee2e2;
          color: #dc2626;
          border-color: #fecaca;
        }

        .os-scheme-row p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 500;
        }

        .os-scheme-row .os-scheme-benefit {
          color: #475569;
          font-weight: 700;
        }

        .os-scheme-arrow {
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

        .os-scheme-row:hover .os-scheme-arrow {
          background: #ffedd5;
        }

        .os-scheme-status-text {
          margin: 0;
          padding: 14px 16px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
        }

        .os-scheme-sidebar {
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

        .os-side-card a,
        .os-side-category-list button {
          display: block;
          width: 100%;
          padding: 10px 0;
          border: none;
          border-bottom: 1px solid #f1f5f9;
          background: transparent;
          color: #1d4ed8;
          text-align: left;
          text-decoration: none;
          font-size: 14px;
          line-height: 1.3;
          font-weight: 800;
          cursor: pointer;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .os-side-card a:last-child,
        .os-side-category-list button:last-child {
          border-bottom: none;
        }

        .os-side-card a:hover,
        .os-side-category-list button:hover,
        .os-side-category-list button.active {
          color: #ea580c;
          background: #fff7ed;
          text-decoration: none;
        }

        .os-side-category-list {
          display: grid;
        }

        .os-side-category-list button {
          border-radius: 10px;
          padding: 10px 8px;
        }

        .os-side-note p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          font-weight: 500;
        }

        @media (max-width: 900px) {
          .os-scheme-container {
            width: min(100% - 24px, 1180px);
            padding-top: 18px;
          }

          .os-scheme-top h1 {
            font-size: 26px;
          }

          .os-scheme-top span {
            font-size: 13px;
          }

          .os-scheme-layout {
            grid-template-columns: 1fr;
          }

          .os-scheme-sidebar {
            position: static;
          }

          .os-scheme-row {
            padding: 13px 14px;
          }

          .os-scheme-title-line {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .os-scheme-date-line {
            justify-content: flex-start;
            max-width: 100%;
          }

          .os-scheme-row h3 {
            font-size: 15px;
          }

          .os-scheme-date-line span {
            font-size: 12px;
          }

          .os-scheme-row p {
            font-size: 12.8px;
          }

          .os-scheme-section-head {
            padding: 13px 14px;
          }
        }
      `}</style>
    </main>
  );
}