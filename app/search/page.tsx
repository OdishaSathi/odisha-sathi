"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

type ImportantDate = {
  label?: string;
  value?: string;
};

type SearchPost = {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  content?: string;
  schemeName?: string;
  department?: string;
  description?: string;
  examName?: string;
  organization?: string;
  status?: string;
  toolName?: string;
  toolCategory?: string;
  toolUrl?: string;
  href?: string;
  externalUrl?: string;
  startDate?: string;
  examDate?: string;
  resultDate?: string;
  admitCardDate?: string;
  releaseDate?: string;
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

function getTimeValue(post: SearchPost) {
  return post.createdAt?.seconds || 0;
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

function getCategoryLabel(category?: string) {
  if (category === "jobs") return "Job";
  if (category === "results") return "Result";
  if (category === "admissions") return "Admission";
  if (category === "admit-cards") return "Admit Card";
  if (category === "schemes") return "Scheme";
  if (category === "pdf-tools") return "PDF Tools";
  if (category === "image-tools") return "Image Tools";
  if (category === "tools") return "Tool";
  return "Post";
}

function getDisplayTitle(post: SearchPost) {
  if (post.category === "schemes") {
    return post.schemeName || post.title || "Untitled Scheme";
  }

  if (post.category === "tools") {
    return post.toolName || post.title || "Untitled Tool";
  }

  return post.title || "Untitled Post";
}

function getPostLink(post: SearchPost) {
  if (post.externalUrl) {
    return post.externalUrl;
  }

  if (post.href) {
    return post.href;
  }

  if (post.category === "schemes") {
    return `/schemes/${post.id}`;
  }

  if (post.category === "admit-cards") {
    return `/admit-cards/${post.slug || post.id}`;
  }

  if (post.category === "results") {
    return `/results/${post.slug || post.id}`;
  }

  if (post.category === "admissions") {
    return `/admissions/${post.slug || post.id}`;
  }

  if (post.category === "pdf-tools") {
    return "/tools/pdf-tools";
  }

  if (post.category === "image-tools") {
    return "/tools/image-tools";
  }

  if (post.category === "tools") {
    if (post.toolCategory === "image-tools") return "/tools/image-tools";
    return "/tools/pdf-tools";
  }

  return `/post/${post.slug || post.id}`;
}

function getPublishedDate(post: SearchPost) {
  return formatDate(post.createdAt);
}

function getStartDate(post: SearchPost) {
  const directDate =
    post.startDate ||
    post.examDate ||
    post.resultDate ||
    post.admitCardDate ||
    post.releaseDate ||
    post.applicationStartDate ||
    post.openingDate ||
    "";

  if (directDate) {
    return formatDate(directDate);
  }

  const matchedDate = post.importantDates?.find((dateItem) => {
    const label = (dateItem.label || "").toLowerCase();

    return (
      label.includes("start") ||
      label.includes("opening") ||
      label.includes("begin") ||
      label.includes("exam") ||
      label.includes("result") ||
      label.includes("release") ||
      label.includes("admit")
    );
  });

  return formatDate(matchedDate?.value);
}

function getLastDate(post: SearchPost) {
  const directDate =
    post.lastDate ||
    post.applicationLastDate ||
    post.applicationEndDate ||
    post.closingDate ||
    post.endDate ||
    "";

  if (directDate) {
    return formatDate(directDate);
  }

  const matchedDate = post.importantDates?.find((dateItem) => {
    const label = (dateItem.label || "").toLowerCase();

    return (
      label.includes("last") ||
      label.includes("closing") ||
      label.includes("end")
    );
  });

  return formatDate(matchedDate?.value);
}

function getMeta(post: SearchPost) {
  const text =
    post.category === "schemes"
      ? post.department || post.description || "Government scheme update."
      : post.category === "tools" ||
        post.category === "pdf-tools" ||
        post.category === "image-tools"
      ? post.description || "Useful online tool."
      : post.examName ||
        post.organization ||
        post.department ||
        post.content ||
        post.description ||
        "Click to read full update, important dates and useful links.";

  return text.length > 125 ? `${text.slice(0, 125)}...` : text;
}

function isExternalLink(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

function SearchResultRow({ post }: { post: SearchPost }) {
  const href = getPostLink(post);
  const publishedDate = getPublishedDate(post);
  const startDate = getStartDate(post);
  const lastDate = getLastDate(post);
  const content = (
    <>
      <div className="os-search-row-content">
        <div className="os-search-title-line">
          <h3>{getDisplayTitle(post)}</h3>

          <div className="os-search-date-line">
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

        <div className="os-search-tag-row">
          <span>{getCategoryLabel(post.category)}</span>

          {post.status ? <span>{post.status}</span> : null}
        </div>

        <p>{getMeta(post)}</p>
      </div>

      <span className="os-search-arrow">›</span>
    </>
  );

  if (isExternalLink(href)) {
    return (
      <a
        href={href}
        className="os-search-row"
        target="_blank"
        rel="noopener noreferrer"
      >
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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSearchResults = async () => {
      const params = new URLSearchParams(window.location.search);
      const searchText = params.get("q") || "";
      const cleanSearch = searchText.trim().toLowerCase();

      setQuery(searchText);

      if (!cleanSearch) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [postsSnapshot, admitCardsSnapshot, resultsSnapshot] =
          await Promise.all([
            getDocs(collection(db, "posts")),
            getDocs(collection(db, "admitCards")),
            getDocs(collection(db, "results")),
          ]);

        const fixedToolCategories: SearchPost[] = [
          {
            id: "pdf-tools",
            title: "PDF Tools",
            category: "pdf-tools",
            href: "/tools/pdf-tools",
            description:
              "Compress PDF, merge PDF, split PDF, convert PDF and other PDF tools.",
            createdAt: null,
          },
          {
            id: "image-tools",
            title: "Image Tools",
            category: "image-tools",
            href: "/tools/image-tools",
            description:
              "Resize image, crop image, compress image and other image tools.",
            createdAt: null,
          },
        ];

        const allPosts: SearchPost[] = postsSnapshot.docs.map((docItem) => {
          const data = docItem.data();

          return {
            id: docItem.id,
            title: data.title || data.toolName || "",
            slug: data.slug || "",
            category: data.category || "",
            content: data.content || data.description || "",
            schemeName: data.schemeName || data.title || "",
            department: data.department || "",
            description: data.description || data.content || "",
            organization: data.organization || "",
            status: data.status || "",
            toolName: data.toolName || data.title || "",
            toolCategory: data.toolCategory || "",
            toolUrl: data.toolUrl || "",
            externalUrl: data.toolUrl || "",
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
        });

        const filteredPosts = allPosts.filter(
          (post) =>
            post.category !== "scheme-category" &&
            post.category !== "admit-cards" &&
            post.category !== "results" &&
            post.category !== ""
        );

        const allAdmitCards: SearchPost[] = admitCardsSnapshot.docs.map(
          (docItem) => {
            const data = docItem.data();

            return {
              id: docItem.id,
              title: data.title || "",
              slug: data.slug || "",
              category: "admit-cards",
              content: data.description || "",
              description: data.description || "",
              examName: data.examName || "",
              organization: data.organization || data.department || "",
              status: data.status || "",
              startDate:
                data.startDate ||
                data.examDate ||
                data.admitCardDate ||
                data.releaseDate ||
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
              applicationLastDate: data.applicationLastDate || "",
              closingDate: data.closingDate || "",
              endDate: data.endDate || "",
              importantDates: data.importantDates || [],
              createdAt: data.createdAt || null,
            };
          }
        );

        const allResults: SearchPost[] = resultsSnapshot.docs.map((docItem) => {
          const data = docItem.data();

          return {
            id: docItem.id,
            title: data.title || "",
            slug: data.slug || "",
            category: "results",
            content: data.description || "",
            description: data.description || "",
            examName: data.examName || "",
            organization: data.organization || "",
            status: data.status || "",
            startDate: data.resultDate || data.startDate || "",
            resultDate: data.resultDate || "",
            lastDate:
              data.lastDate ||
              data.applicationLastDate ||
              data.closingDate ||
              data.endDate ||
              "",
            applicationLastDate: data.applicationLastDate || "",
            closingDate: data.closingDate || "",
            endDate: data.endDate || "",
            importantDates: data.importantDates || [],
            createdAt: data.createdAt || null,
          };
        });

        const combinedPosts = [
          ...fixedToolCategories,
          ...filteredPosts,
          ...allAdmitCards,
          ...allResults,
        ];

        const filteredResults = combinedPosts
          .filter((post) => {
            const combinedText = [
              post.title,
              post.schemeName,
              post.department,
              post.content,
              post.description,
              post.examName,
              post.organization,
              post.status,
              post.category,
              post.toolName,
              post.toolCategory,
              getCategoryLabel(post.category),
            ]
              .join(" ")
              .toLowerCase();

            return combinedText.includes(cleanSearch);
          })
          .sort((a, b) => getTimeValue(b) - getTimeValue(a));

        setResults(filteredResults);
      } catch (error) {
        console.error(error);
        alert("Failed to load search results");
      } finally {
        setLoading(false);
      }
    };

    loadSearchResults();
  }, []);

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

              {loading ? (
                <p className="os-search-status">Searching...</p>
              ) : !query.trim() ? (
                <p className="os-search-status">
                  Please enter a search keyword.
                </p>
              ) : results.length === 0 ? (
                <p className="os-search-status">No results found.</p>
              ) : (
                <div className="os-search-board">
                  {results.map((post) => (
                    <SearchResultRow
                      key={`${post.category}-${post.id}`}
                      post={post}
                    />
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
              <Link href="/admit-cards">Admit Cards</Link>
              <Link href="/schemes">Schemes</Link>
              <Link href="/tools">Tools</Link>
            </section>

            <section className="os-side-card os-side-note">
              <h2>Search Tips</h2>
              <p>
                Try searching with exam name, job name, admission name, scheme
                name, PDF tools or image tools.
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