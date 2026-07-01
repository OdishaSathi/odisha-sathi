"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

type LatestPost = {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  schemeName?: string;
  createdAt?: any;
};

const toolCategories = [
  {
    title: "PDF Tools",
    href: "/tools/pdf-tools",
    description: "Compress, merge, split, convert and manage PDF files.",
    type: "pdf",
  },
  {
    title: "Image Tools",
    href: "/tools/image-tools",
    description: "Resize, crop, compress and edit images easily.",
    type: "image",
  },
];

function getTimeValue(item: LatestPost) {
  return item.createdAt?.seconds || 0;
}

function getTitle(item: LatestPost) {
  if (item.category === "schemes") {
    return item.schemeName || item.title || "Untitled Scheme";
  }

  return item.title || "Untitled Update";
}

function getCategoryLabel(item: LatestPost) {
  if (item.category === "jobs") return "Job";
  if (item.category === "results") return "Result";
  if (item.category === "admissions") return "Admission";
  if (item.category === "admit-cards") return "Admit Card";
  if (item.category === "schemes") return "Scheme";
  return "Update";
}

function getPostLink(item: LatestPost) {
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

function ToolIcon({ type }: { type: string }) {
  if (type === "pdf") {
    return (
      <div className="os-tool-icon os-tool-icon-pdf">
        <div className="os-pdf-paper">
          <span>PDF</span>
        </div>
      </div>
    );
  }

  return (
    <div className="os-tool-icon os-tool-icon-image">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M6.5 7h19A2.5 2.5 0 0 1 28 9.5v13A2.5 2.5 0 0 1 25.5 25h-19A2.5 2.5 0 0 1 4 22.5v-13A2.5 2.5 0 0 1 6.5 7Zm0 2A.5.5 0 0 0 6 9.5v13a.5.5 0 0 0 .5.5h19a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-19Zm3.5 4a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm-1.3 7.8 4.2-4.7a1 1 0 0 1 1.5.02l2.6 3.05 2.1-2.45a1 1 0 0 1 1.52.01l3.05 3.65a1 1 0 0 1-.77 1.64H9.45a1 1 0 0 1-.75-1.22Z" />
      </svg>
    </div>
  );
}

export default function ToolsPage() {
  const [latestPosts, setLatestPosts] = useState<LatestPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLatestPosts = async () => {
      try {
        setLoading(true);

        const [postsSnapshot, admitCardsSnapshot, resultsSnapshot] =
          await Promise.all([
            getDocs(collection(db, "posts")),
            getDocs(collection(db, "admitCards")),
            getDocs(collection(db, "results")),
          ]);

        const allPosts: LatestPost[] = postsSnapshot.docs
          .map((docItem) => {
            const data = docItem.data();

            return {
              id: docItem.id,
              title: data.title || "",
              slug: data.slug || "",
              category: data.category || "",
              schemeName: data.schemeName || data.title || "",
              createdAt: data.createdAt || null,
            };
          })
          .filter(
            (item) =>
              item.category !== "scheme-category" &&
              item.category !== "tools" &&
              item.category !== ""
          );

        const allAdmitCards: LatestPost[] = admitCardsSnapshot.docs.map(
          (docItem) => {
            const data = docItem.data();

            return {
              id: docItem.id,
              title: data.title || "",
              slug: data.slug || "",
              category: "admit-cards",
              createdAt: data.createdAt || null,
            };
          }
        );

        const allResults: LatestPost[] = resultsSnapshot.docs.map((docItem) => {
          const data = docItem.data();

          return {
            id: docItem.id,
            title: data.title || "",
            slug: data.slug || "",
            category: "results",
            createdAt: data.createdAt || null,
          };
        });

        const latest = [...allPosts, ...allAdmitCards, ...allResults]
          .sort((a, b) => getTimeValue(b) - getTimeValue(a))
          .slice(0, 8);

        setLatestPosts(latest);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadLatestPosts();
  }, []);

  const quickAccess = useMemo(
    () => [
      { label: "Latest Jobs", href: "/jobs" },
      { label: "Results", href: "/results" },
      { label: "Admissions", href: "/admissions" },
      { label: "Admit Cards", href: "/admit-cards" },
      { label: "Schemes", href: "/schemes" },
      { label: "Home", href: "/" },
    ],
    []
  );

  return (
    <main className="os-tools-page">
      <div className="os-tools-container">
        <section className="os-tools-head">
          <p>Odisha Sathi Tools</p>
          <h1>Useful Online Tools</h1>
          <span>PDF tools, image tools and useful online services.</span>
        </section>

        <section className="os-tools-category-grid">
          {toolCategories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className={`os-tool-feature-card os-tool-feature-${category.type}`}
            >
              <ToolIcon type={category.type} />

              <div className="os-tool-feature-content">
                <span>{category.type === "pdf" ? "Document Tools" : "Photo Tools"}</span>
                <h2>{category.title}</h2>
                <p>{category.description}</p>
              </div>

              <div className="os-tool-feature-arrow">›</div>
            </Link>
          ))}
        </section>

        <section className="os-tools-content-layout">
          <div className="os-tools-panel os-tools-latest-panel">
            <div className="os-tools-panel-head">
              <h2>Latest Posts</h2>
              <Link href="/">View All</Link>
            </div>

            {loading ? (
              <p className="os-tools-status">Loading latest posts...</p>
            ) : latestPosts.length === 0 ? (
              <p className="os-tools-status">No latest posts available.</p>
            ) : (
              <div className="os-tools-latest-list">
                {latestPosts.map((item) => (
                  <Link
                    key={`${item.category}-${item.id}`}
                    href={getPostLink(item)}
                    className="os-tools-latest-item"
                  >
                    <span>{getCategoryLabel(item)}</span>
                    <strong>{getTitle(item)}</strong>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="os-tools-side">
            <div className="os-tools-panel">
              <div className="os-tools-panel-head">
                <h2>Quick Access</h2>
              </div>

              <div className="os-tools-link-list">
                {quickAccess.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="os-tools-note-card">
              <h2>Online Tools</h2>
              <p>
                Use these tools for quick PDF and image work. More tools can be
                added from the admin panel later.
              </p>
            </div>
          </aside>
        </section>
      </div>

      <style jsx global>{`
        .os-tools-page {
          min-height: 100vh;
          background: #ffffff;
          color: #0f172a;
        }

        .os-tools-container {
          width: min(100% - 32px, 1180px);
          margin: 0 auto;
          padding: 22px 0 42px;
        }

        .os-tools-head {
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e5e7eb;
        }

        .os-tools-head p {
          margin: 0 0 5px;
          color: #ea580c;
          font-size: 13px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .os-tools-head h1 {
          margin: 0;
          color: #0f172a;
          font-size: 32px;
          line-height: 1.12;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .os-tools-head span {
          display: block;
          margin-top: 6px;
          color: #475569;
          font-size: 14px;
          line-height: 1.45;
          font-weight: 700;
        }

        .os-tools-category-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 18px;
        }

        .os-tool-feature-card {
          position: relative;
          min-height: 178px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 18px;
          padding: 22px;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          background: #ffffff;
          color: inherit;
          text-decoration: none;
          overflow: hidden;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
          transition: background 0.16s ease, border-color 0.16s ease,
            transform 0.16s ease, box-shadow 0.16s ease;
        }

        .os-tool-feature-card::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.9;
        }

        .os-tool-feature-pdf::before {
          background:
            radial-gradient(circle at 88% 18%, rgba(239, 68, 68, 0.15), transparent 32%),
            linear-gradient(135deg, rgba(254, 242, 242, 0.95), rgba(255, 255, 255, 0.2));
        }

        .os-tool-feature-image::before {
          background:
            radial-gradient(circle at 88% 18%, rgba(37, 99, 235, 0.16), transparent 32%),
            linear-gradient(135deg, rgba(239, 246, 255, 0.95), rgba(255, 255, 255, 0.2));
        }

        .os-tool-feature-card:hover {
          background: #fff7ed;
          border-color: #fed7aa;
          transform: translateY(-2px);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.09);
        }

        .os-tool-feature-content,
        .os-tool-icon,
        .os-tool-feature-arrow {
          position: relative;
          z-index: 2;
        }

        .os-tool-feature-content span {
          display: inline-flex;
          margin-bottom: 7px;
          border-radius: 999px;
          background: #ffffff;
          color: #64748b;
          border: 1px solid #e5e7eb;
          padding: 5px 9px;
          font-size: 11px;
          line-height: 1;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .os-tool-feature-content h2 {
          margin: 0;
          color: #1d4ed8;
          font-size: 24px;
          line-height: 1.12;
          font-weight: 950;
          letter-spacing: -0.04em;
          transition: color 0.15s ease;
        }

        .os-tool-feature-card:hover h2 {
          color: #ea580c;
        }

        .os-tool-feature-content p {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
          font-weight: 650;
        }

        .os-tool-icon {
          width: 78px;
          height: 78px;
          border-radius: 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
        }

        .os-tool-icon-pdf {
          background: #ffffff;
          border: 1px solid #fecaca;
          box-shadow: 0 12px 26px rgba(220, 38, 38, 0.12);
        }

        .os-pdf-paper {
          width: 48px;
          height: 58px;
          border-radius: 10px;
          background: #dc2626;
          color: #ffffff;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 10px;
          position: relative;
          overflow: hidden;
        }

        .os-pdf-paper::before {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          border-style: solid;
          border-width: 0 15px 15px 0;
          border-color: transparent #ffffff transparent transparent;
          opacity: 0.9;
        }

        .os-pdf-paper span {
          font-size: 14px;
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.04em;
        }

        .os-tool-icon-image {
          background: #ffffff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          box-shadow: 0 12px 26px rgba(37, 99, 235, 0.13);
        }

        .os-tool-icon-image svg {
          width: 44px;
          height: 44px;
          fill: currentColor;
        }

        .os-tool-feature-arrow {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
          font-size: 25px;
          line-height: 1;
          font-weight: 900;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .os-tool-feature-card:hover .os-tool-feature-arrow {
          color: #ea580c;
          background: #ffedd5;
        }

        .os-tools-content-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 18px;
          align-items: start;
        }

        .os-tools-side {
          display: grid;
          gap: 16px;
          position: sticky;
          top: 92px;
        }

        .os-tools-panel,
        .os-tools-note-card {
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          background: #ffffff;
        }

        .os-tools-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 13px 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .os-tools-panel-head h2,
        .os-tools-note-card h2 {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: -0.025em;
        }

        .os-tools-panel-head a {
          color: #2563eb;
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        .os-tools-panel-head a:hover {
          color: #ea580c;
          text-decoration: underline;
        }

        .os-tools-latest-list {
          display: grid;
        }

        .os-tools-latest-item {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 10px;
          padding: 13px 16px;
          text-decoration: none;
          border-bottom: 1px solid #f1f5f9;
          background: #ffffff;
          transition: background 0.15s ease;
        }

        .os-tools-latest-item:last-child {
          border-bottom: none;
        }

        .os-tools-latest-item:hover {
          background: #fff7ed;
        }

        .os-tools-latest-item span {
          display: inline-flex;
          width: fit-content;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          padding: 5px 8px;
          font-size: 11px;
          line-height: 1;
          font-weight: 900;
          white-space: nowrap;
        }

        .os-tools-latest-item strong {
          color: #1d4ed8;
          font-size: 14.5px;
          line-height: 1.4;
          font-weight: 800;
          transition: color 0.15s ease;
        }

        .os-tools-latest-item:hover strong {
          color: #ea580c;
        }

        .os-tools-link-list {
          display: grid;
          padding: 5px 15px;
        }

        .os-tools-link-list a {
          display: block;
          padding: 11px 0;
          border-bottom: 1px solid #f1f5f9;
          color: #1d4ed8;
          text-decoration: none;
          font-size: 14px;
          font-weight: 800;
          transition: color 0.15s ease;
        }

        .os-tools-link-list a:last-child {
          border-bottom: none;
        }

        .os-tools-link-list a:hover {
          color: #ea580c;
          text-decoration: underline;
        }

        .os-tools-note-card {
          padding: 15px;
        }

        .os-tools-note-card h2 {
          margin-bottom: 10px;
          font-size: 17px;
        }

        .os-tools-note-card p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
          font-weight: 500;
        }

        .os-tools-status {
          margin: 0;
          padding: 14px 16px;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .os-tools-container {
            width: min(100% - 24px, 1180px);
            padding-top: 18px;
          }

          .os-tools-head h1 {
            font-size: 26px;
          }

          .os-tools-head span {
            font-size: 13px;
          }

          .os-tools-category-grid,
          .os-tools-content-layout {
            grid-template-columns: 1fr;
          }

          .os-tools-side {
            position: static;
          }

          .os-tool-feature-card {
            min-height: 148px;
            padding: 17px;
            gap: 14px;
          }

          .os-tool-icon {
            width: 62px;
            height: 62px;
            border-radius: 18px;
          }

          .os-pdf-paper {
            width: 39px;
            height: 49px;
            border-radius: 9px;
          }

          .os-tool-icon-image svg {
            width: 36px;
            height: 36px;
          }

          .os-tool-feature-content h2 {
            font-size: 20px;
          }

          .os-tool-feature-content p {
            font-size: 13px;
          }

          .os-tools-panel-head {
            padding: 13px 14px;
          }

          .os-tools-latest-item {
            grid-template-columns: 1fr;
            gap: 7px;
            padding: 12px 14px;
          }
        }

        @media (max-width: 430px) {
          .os-tool-feature-card {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .os-tool-feature-arrow {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}