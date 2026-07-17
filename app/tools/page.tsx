"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

const latestCollections = [
  { name: "posts", category: "" },
  { name: "jobs", category: "jobs" },
  { name: "admissions", category: "admissions" },
  { name: "admitCards", category: "admit-cards" },
  { name: "admit-cards", category: "admit-cards" },
  { name: "admitcards", category: "admit-cards" },
  { name: "results", category: "results" },
  { name: "result", category: "results" },
  { name: "schemes", category: "schemes" },
  { name: "scheme", category: "schemes" },
];

function getTimeValue(item: LatestPost) {
  return item.createdAt?.seconds || 0;
}

function getTitle(item: LatestPost) {
  return item.category === "schemes"
    ? item.schemeName || item.title || "Untitled Scheme"
    : item.title || "Untitled Update";
}

function getCategoryLabel(item: LatestPost) {
  if (item.category === "jobs") return "Job";
  if (item.category === "results") return "Result";
  if (item.category === "admissions") return "Admission";
  if (item.category === "admit-cards") return "Admit Card & Exam";
  if (item.category === "schemes") return "Scheme";
  return "Update";
}

function normalizeCategory(value?: string) {
  const category = String(value || "").trim().toLowerCase();

  if (["job", "jobs"].includes(category)) return "jobs";
  if (["result", "results"].includes(category)) return "results";
  if (["admission", "admissions"].includes(category)) return "admissions";
  if (
    ["admit-card", "admit-cards", "admitcard", "admitcards", "exam", "exams"].includes(
      category
    )
  ) {
    return "admit-cards";
  }
  if (["scheme", "schemes", "scholarship", "scholarships"].includes(category)) {
    return "schemes";
  }

  return category;
}

async function loadLatestCollection(name: string, categoryOverride: string) {
  try {
    const snapshot = await getDocs(collection(db, name));

    return snapshot.docs.map((docItem): LatestPost => {
      const data = docItem.data();

      return {
        id: docItem.id,
        title: data.title || data.schemeName || "",
        slug: data.slug || "",
        category: normalizeCategory(categoryOverride || data.category || ""),
        schemeName: data.schemeName || data.title || "",
        createdAt: data.createdAt || null,
      };
    });
  } catch (error) {
    console.warn(`Could not load ${name}`, error);
    return [];
  }
}

function ToolIcon({ type }: { type: string }) {
  if (type === "pdf") {
    return (
      <div className="os-tool-icon os-tool-icon-pdf" aria-hidden="true">
        <div className="os-pdf-paper">PDF</div>
      </div>
    );
  }

  return (
    <div className="os-tool-icon os-tool-icon-image" aria-hidden="true">
      <svg viewBox="0 0 32 32">
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
      setLoading(true);

      const groups = await Promise.all(
        latestCollections.map((item) =>
          loadLatestCollection(item.name, item.category)
        )
      );

      const uniquePosts = new Map<string, LatestPost>();

      groups
        .flat()
        .filter(
          (item) =>
            item.title &&
            item.category &&
            item.category !== "tools" &&
            item.category !== "scheme-category"
        )
        .sort((a, b) => getTimeValue(b) - getTimeValue(a))
        .forEach((item) => {
          const key = `${item.category}:${item.slug || item.id}`;
          if (!uniquePosts.has(key)) uniquePosts.set(key, item);
        });

      setLatestPosts(Array.from(uniquePosts.values()).slice(0, 8));
      setLoading(false);
    };

    loadLatestPosts();
  }, []);

  const quickAccess = useMemo(
    () => [
      { label: "Latest Jobs", href: "/jobs" },
      { label: "Results", href: "/results" },
      { label: "Admissions", href: "/admissions" },
      { label: "Admit Cards & Exams", href: "/admit-cards" },
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

              <div className="os-tool-feature-arrow" aria-hidden="true">›</div>
            </Link>
          ))}
        </section>

        <section className="os-tools-content-layout">
          <div className="os-tools-panel">
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
                    href={`/post/${item.slug || item.id}`}
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
                  <Link key={item.href} href={item.href}>{item.label}</Link>
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
        .os-tools-page { min-height: 100vh; background: #fff; color: #0f172a; }
        .os-tools-container { width: min(100% - 32px, 1180px); margin: 0 auto; padding: 22px 0 42px; }
        .os-tools-head { margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid #e5e7eb; }
        .os-tools-head p { margin: 0 0 5px; color: #ea580c; font-size: 13px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
        .os-tools-head h1 { margin: 0; font-size: clamp(27px, 4vw, 32px); line-height: 1.12; font-weight: 900; letter-spacing: -.04em; }
        .os-tools-head > span { display: block; margin-top: 6px; color: #475569; font-size: 14px; font-weight: 700; }
        .os-tools-category-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-bottom: 18px; }
        .os-tool-feature-card { position: relative; min-height: 178px; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 18px; padding: 22px; border: 1px solid #e5e7eb; border-radius: 22px; color: inherit; text-decoration: none; overflow: hidden; box-shadow: 0 10px 28px rgba(15,23,42,.05); transition: .18s ease; }
        .os-tool-feature-pdf { background: linear-gradient(135deg, #fff1f2, #fff); }
        .os-tool-feature-image { background: linear-gradient(135deg, #eff6ff, #fff); }
        .os-tool-feature-card:hover { border-color: #fdba74; transform: translateY(-2px); box-shadow: 0 15px 32px rgba(15,23,42,.09); }
        .os-tool-icon { position: relative; z-index: 1; width: 68px; height: 68px; display: grid; place-items: center; border-radius: 18px; }
        .os-tool-icon-pdf { background: #fee2e2; color: #dc2626; }
        .os-pdf-paper { width: 42px; height: 50px; display: grid; place-items: center; background: #fff; border: 2px solid currentColor; border-radius: 6px; font-size: 13px; font-weight: 950; }
        .os-tool-icon-image { background: #dbeafe; color: #2563eb; }
        .os-tool-icon-image svg { width: 42px; fill: currentColor; }
        .os-tool-feature-content { position: relative; z-index: 1; }
        .os-tool-feature-content > span { color: #64748b; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; }
        .os-tool-feature-content h2 { margin: 5px 0; font-size: 24px; font-weight: 950; }
        .os-tool-feature-content p { margin: 0; color: #475569; font-size: 14px; line-height: 1.5; font-weight: 650; }
        .os-tool-feature-arrow { position: relative; z-index: 1; font-size: 38px; font-weight: 500; color: #64748b; }
        .os-tools-content-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 18px; align-items: start; }
        .os-tools-side { display: grid; gap: 18px; }
        .os-tools-panel, .os-tools-note-card { border: 1px solid #e5e7eb; border-radius: 16px; background: #fff; overflow: hidden; }
        .os-tools-panel-head { min-height: 50px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; }
        .os-tools-panel-head h2, .os-tools-note-card h2 { margin: 0; font-size: 18px; font-weight: 900; }
        .os-tools-panel-head a { color: #2563eb; font-size: 13px; font-weight: 850; text-decoration: none; }
        .os-tools-latest-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .os-tools-latest-item { min-height: 82px; display: flex; flex-direction: column; justify-content: center; gap: 5px; padding: 14px 16px; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; color: inherit; text-decoration: none; }
        .os-tools-latest-item:hover { background: #fff7ed; }
        .os-tools-latest-item span { color: #ea580c; font-size: 11px; font-weight: 900; text-transform: uppercase; }
        .os-tools-latest-item strong { font-size: 14px; line-height: 1.4; }
        .os-tools-status { margin: 0; padding: 18px; color: #64748b; }
        .os-tools-link-list { display: grid; }
        .os-tools-link-list a { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; color: #1d4ed8; font-size: 14px; font-weight: 800; text-decoration: none; }
        .os-tools-link-list a:hover { color: #ea580c; background: #fff7ed; }
        .os-tools-note-card { padding: 18px; background: #f8fafc; }
        .os-tools-note-card p { margin: 8px 0 0; color: #475569; font-size: 14px; line-height: 1.55; }
        @media (max-width: 820px) { .os-tools-content-layout { grid-template-columns: 1fr; } }
        @media (max-width: 680px) { .os-tools-category-grid, .os-tools-latest-list { grid-template-columns: 1fr; } .os-tool-feature-card { min-height: 150px; padding: 18px; gap: 14px; } .os-tool-icon { width: 56px; height: 56px; } }
      `}</style>
    </main>
  );
}
