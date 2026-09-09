"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FilePlus2,
  RefreshCw,
  Search,
  TimerReset,
} from "lucide-react";
import { db } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";

type ImportantDate = { label?: string; value?: string };
type ImportantLink = { label?: string; title?: string; url?: string; href?: string };

type AdminPost = {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  schemeName?: string;
  department?: string;
  organization?: string;
  shortDescription?: string;
  description?: string;
  content?: string;
  createdAt?: any;
  updatedAt?: any;
  lastDate?: string;
  lastDateDisplay?: string;
  applicationLastDate?: string;
  applyLastDate?: string;
  applicationEndDate?: string;
  closingDate?: string;
  endDate?: string;
  deadline?: string;
  examDate?: string;
  examDateDisplay?: string;
  importantDates?: ImportantDate[];
  importantLinks?: ImportantLink[];
  links?: ImportantLink[];
  sourceUrl?: string;
  canonicalStartDate?: string;
  canonicalLastDate?: string;
  canonicalExamDate?: string;
  canonicalResultDate?: string;
  lifecycleStatus?: string;
  sourceReferenceStatus?: string;
  sourceReferenceType?: string;
  sourceReferenceLabel?: string;
  sourceReferenceUrl?: string;
  dataQualityVersion?: number;
};

const categories = [
  ["jobs", "Jobs", "/admin/jobs"],
  ["results", "Results", "/admin/results"],
  ["admissions", "Admissions", "/admin/admissions"],
  ["admit-cards", "Exams", "/admin/admit-cards"],
  ["schemes", "Schemes", "/admin/schemes"],
  ["citizen-services", "Citizen Services", "/admin/citizen-services"],
] as const;

function publicLink(post: AdminPost) {
  return post.category === "citizen-services"
    ? `/citizen-services/${post.slug || post.id}`
    : `/post/${post.slug || post.id}`;
}

function editLink(post: AdminPost) {
  const map: Record<string, string> = {
    jobs: "jobs/edit",
    results: "results",
    admissions: "admissions/edit",
    "admit-cards": "admit-cards/edit",
    schemes: "schemes/edit",
  };

  if (post.category === "citizen-services") return "/admin/citizen-services";

  const section = map[post.category || ""];
  return section ? `/admin/${section}/${post.id}` : "/admin";
}

function timeValue(value: any) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateValue(value?: unknown): Date | null {
  const text = String(value || "").trim();
  if (!text) return null;

  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const result = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    return Number.isNaN(result.getTime()) ? null : normalizeDate(result);
  }

  const dmy = text.match(/^(\d{1,2})[\s./-](\d{1,2})[\s./-](\d{4})$/);
  if (dmy) {
    const result = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    return Number.isNaN(result.getTime()) ? null : normalizeDate(result);
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : normalizeDate(parsed);
}

function findImportantDate(post: AdminPost, keywords: string[]) {
  const row = (post.importantDates || []).find((item) => {
    const label = String(item.label || "").toLowerCase();
    return keywords.some((keyword) => label.includes(keyword));
  });
  return row?.value || "";
}

function getLastDate(post: AdminPost) {
  const direct =
    post.canonicalLastDate ||
    post.lastDateDisplay ||
    post.lastDate ||
    post.applicationLastDate ||
    post.applyLastDate ||
    post.applicationEndDate ||
    post.closingDate ||
    post.endDate ||
    post.deadline;

  return parseDateValue(direct) || parseDateValue(findImportantDate(post, ["last date", "closing", "deadline", "end date"]));
}

function getExamDate(post: AdminPost) {
  const direct = post.canonicalExamDate || post.examDateDisplay || post.examDate;
  return parseDateValue(direct) || parseDateValue(findImportantDate(post, ["exam date", "examination date", "test date"]));
}

function hasUsefulLink(post: AdminPost) {
  if (post.sourceReferenceStatus === "linked" && String(post.sourceReferenceUrl || "").trim()) return true;
  if (String(post.sourceUrl || "").trim()) return true;
  const links = [...(post.importantLinks || []), ...(post.links || [])];
  return links.some((item) => String(item.url || item.href || "").trim().startsWith("http"));
}

function hasUsefulDescription(post: AdminPost) {
  const text = String(post.shortDescription || post.description || post.content || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length >= 40;
}

function daysFromToday(date: Date) {
  const today = normalizeDate(new Date());
  return Math.round((date.getTime() - today.getTime()) / 86400000);
}

function categoryLabel(category?: string) {
  return categories.find(([key]) => key === category)?.[1] || category || "Post";
}

function lifecycleLabel(post: AdminPost) {
  const stored = String(post.lifecycleStatus || "").trim().toLowerCase();
  if (stored) {
    const map: Record<string, string> = {
      upcoming: "Upcoming",
      open: "Open",
      "closing-soon": "Closing soon",
      closed: "Closed",
      scheduled: "Scheduled",
      completed: "Completed",
      released: "Released",
      active: "Active",
    };
    return map[stored] || stored.replace(/-/g, " ");
  }

  const lastDate = getLastDate(post);
  if (lastDate) {
    const days = daysFromToday(lastDate);
    if (days < 0) return "Closed";
    if (days <= 2) return "Closing soon";
    return "Open";
  }

  const examDate = getExamDate(post);
  if (examDate) return daysFromToday(examDate) >= 0 ? "Scheduled" : "Completed";
  return "Active";
}

function lifecycleClass(label: string) {
  const value = label.toLowerCase();
  if (value.includes("closing") || value === "closed") return "warn";
  if (value === "open" || value === "released") return "good";
  if (value === "scheduled" || value === "upcoming") return "info";
  return "neutral";
}

export default function AdminDashboardPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [importantCount, setImportantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [postSnapshot, infoSnapshot] = await Promise.all([
        getDocs(collection(db, "posts")),
        getDocs(collection(db, "importantInformation")),
      ]);

      setPosts(
        postSnapshot.docs
          .map((item) => ({ id: item.id, ...(item.data() as Omit<AdminPost, "id">) }))
          .sort((a, b) => Math.max(timeValue(b.updatedAt), timeValue(b.createdAt)) - Math.max(timeValue(a.updatedAt), timeValue(a.createdAt)))
      );
      setImportantCount(infoSnapshot.size);
    } catch (err) {
      console.error(err);
      setError("Dashboard data could not be loaded. Check your connection and Firestore permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const visiblePosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return posts
      .filter((post) => !term || `${post.title} ${post.schemeName} ${post.department} ${post.organization} ${post.category}`.toLowerCase().includes(term))
      .slice(0, 10);
  }, [posts, search]);

  const contentPosts = useMemo(
    () => posts.filter((post) => categories.some(([key]) => key === post.category)),
    [posts]
  );

  const operations = useMemo(() => {
    const closingSoon: Array<{ post: AdminPost; days: number }> = [];
    const upcomingExams: Array<{ post: AdminPost; days: number }> = [];
    const expired: Array<{ post: AdminPost; days: number }> = [];
    const incomplete: Array<{ post: AdminPost; reason: string }> = [];

    contentPosts.forEach((post) => {
      const lastDate = getLastDate(post);
      if (lastDate) {
        const days = daysFromToday(lastDate);
        if (days >= 0 && days <= 7) closingSoon.push({ post, days });
        if (days < 0) expired.push({ post, days });
      }

      const examDate = getExamDate(post);
      if (examDate) {
        const days = daysFromToday(examDate);
        if (days >= 0 && days <= 14) upcomingExams.push({ post, days });
      }

      if (!hasUsefulLink(post)) {
        incomplete.push({ post, reason: "No official/apply link detected" });
      } else if (!hasUsefulDescription(post)) {
        incomplete.push({ post, reason: "Description is missing or very short" });
      }
    });

    closingSoon.sort((a, b) => a.days - b.days);
    upcomingExams.sort((a, b) => a.days - b.days);
    expired.sort((a, b) => b.days - a.days);

    return { closingSoon, upcomingExams, expired, incomplete };
  }, [contentPosts]);

  const dataHealth = useMemo(() => {
    const structured = contentPosts.filter((post) => Number(post.dataQualityVersion || 0) >= 1).length;
    const sourceLinked = contentPosts.filter((post) => hasUsefulLink(post)).length;
    const sourceMissing = contentPosts.length - sourceLinked;
    const legacy = contentPosts.length - structured;
    return { structured, sourceLinked, sourceMissing, legacy };
  }, [contentPosts]);

  return (
    <AdminLayout>
      <div className="dashboard-stack">
        <section className="dashboard-welcome">
          <div>
            <h2>Website overview</h2>
            <p>Manage content, check deadlines and find posts that need attention.</p>
          </div>
          <button type="button" onClick={() => void loadDashboard()} disabled={loading}>
            <RefreshCw size={17} className={loading ? "spin" : ""} />
            {loading ? "Refreshing" : "Refresh"}
          </button>
        </section>

        {error ? <div className="dashboard-error" role="alert">{error}</div> : null}

        <section>
          <div className="section-heading">
            <div>
              <h2>Needs attention</h2>
              <p>Automatically calculated from your current post data</p>
            </div>
          </div>
          <div className="attention-grid">
            <article className="attention-card urgent">
              <TimerReset size={22} />
              <div><span>Closing in 7 days</span><strong>{loading ? "—" : operations.closingSoon.length}</strong></div>
            </article>
            <article className="attention-card exam">
              <CalendarClock size={22} />
              <div><span>Exams in 14 days</span><strong>{loading ? "—" : operations.upcomingExams.length}</strong></div>
            </article>
            <article className="attention-card expired">
              <AlertTriangle size={22} />
              <div><span>Past deadlines</span><strong>{loading ? "—" : operations.expired.length}</strong></div>
            </article>
            <article className="attention-card incomplete">
              <CheckCircle2 size={22} />
              <div><span>Review suggested</span><strong>{loading ? "—" : operations.incomplete.length}</strong></div>
            </article>
          </div>
        </section>

        {!loading && (operations.closingSoon.length > 0 || operations.upcomingExams.length > 0 || operations.incomplete.length > 0) ? (
          <section className="action-panel">
            <div className="section-heading">
              <div><h2>Action list</h2><p>The most time-sensitive items first</p></div>
            </div>
            <div className="action-list">
              {operations.closingSoon.slice(0, 5).map(({ post, days }) => (
                <article key={`closing-${post.id}`}>
                  <div><span className="action-tag red">{days === 0 ? "Closes today" : `Closes in ${days} day${days === 1 ? "" : "s"}`}</span><h3>{post.title || post.schemeName || "Untitled post"}</h3><p>{categoryLabel(post.category)}</p></div>
                  <div className="post-actions"><Link href={publicLink(post)} target="_blank"><ExternalLink size={15}/>View</Link><Link href={editLink(post)}>Edit</Link></div>
                </article>
              ))}
              {operations.upcomingExams.slice(0, 4).map(({ post, days }) => (
                <article key={`exam-${post.id}`}>
                  <div><span className="action-tag blue">{days === 0 ? "Exam today" : `Exam in ${days} day${days === 1 ? "" : "s"}`}</span><h3>{post.title || "Untitled post"}</h3><p>{categoryLabel(post.category)}</p></div>
                  <div className="post-actions"><Link href={publicLink(post)} target="_blank"><ExternalLink size={15}/>View</Link><Link href={editLink(post)}>Edit</Link></div>
                </article>
              ))}
              {operations.incomplete.slice(0, 4).map(({ post, reason }) => (
                <article key={`incomplete-${post.id}`}>
                  <div><span className="action-tag amber">Review</span><h3>{post.title || post.schemeName || "Untitled post"}</h3><p>{reason}</p></div>
                  <div className="post-actions"><Link href={publicLink(post)} target="_blank"><ExternalLink size={15}/>View</Link><Link href={editLink(post)}>Edit</Link></div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <div className="section-heading">
            <div>
              <h2>Data health</h2>
              <p>Uses the automatic metadata added when a post is saved</p>
            </div>
          </div>
          <div className="health-grid">
            <article><span>Structured metadata</span><strong>{loading ? "—" : `${dataHealth.structured}/${contentPosts.length}`}</strong><small>Posts with normalized dates/status</small></article>
            <article><span>Source linked</span><strong>{loading ? "—" : dataHealth.sourceLinked}</strong><small>Official/apply/reference link detected</small></article>
            <article className={dataHealth.sourceMissing ? "needs-review" : ""}><span>Source missing</span><strong>{loading ? "—" : dataHealth.sourceMissing}</strong><small>Review before important updates</small></article>
            <article className={dataHealth.legacy ? "legacy" : ""}><span>Legacy metadata</span><strong>{loading ? "—" : dataHealth.legacy}</strong><small>Edit and save once to upgrade old posts</small></article>
          </div>
        </section>

        <section>
          <div className="section-heading"><div><h2>Visitor analytics</h2><p>Google Analytics connection status</p></div><Link href="/admin/analytics">Open Analytics</Link></div>
          <div className="analytics-placeholder">
            <BarChart3 size={30}/><div><strong>GA4 visitor dashboard</strong><p>View active visitors, today, 7-day and 30-day totals, popular pages and devices.</p></div><Link href="/admin/analytics">View report</Link>
          </div>
        </section>

        <section>
          <div className="section-heading"><div><h2>Content totals</h2><p>{contentPosts.length + importantCount} managed items</p></div></div>
          <div className="count-grid">
            {categories.map(([key, label, href]) => <Link href={href} className="count-card" key={key}><span>{label}</span><strong>{loading ? "—" : posts.filter((post) => post.category === key).length}</strong></Link>)}
            <Link href="/admin/important-information" className="count-card"><span>Important Info</span><strong>{loading ? "—" : importantCount}</strong></Link>
          </div>
        </section>

        <section>
          <div className="section-heading"><div><h2>Quick create</h2><p>Jump directly to a content section</p></div></div>
          <div className="quick-grid">
            {categories.map(([key, label, href]) => <Link key={key} href={href}><FilePlus2 size={18}/>New {label}</Link>)}
            <Link href="/admin/important-information"><FilePlus2 size={18}/>New Important Info</Link>
          </div>
        </section>

        <section className="recent-panel">
          <div className="section-heading"><div><h2>Recent posts</h2><p>Search and open your latest saved content</p></div></div>
          <label className="dashboard-search"><Search size={18}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, department or category…" /></label>
          {loading ? <p className="empty-state">Loading recent posts…</p> : visiblePosts.length === 0 ? <p className="empty-state">No matching posts found.</p> : (
            <div className="recent-list">{visiblePosts.map((post) => (
              <article key={post.id}>
                <div>
                  <div className="recent-badges">
                    <span>{categoryLabel(post.category)}</span>
                    <span className={`lifecycle-badge ${lifecycleClass(lifecycleLabel(post))}`}>{lifecycleLabel(post)}</span>
                    <span className={`source-badge ${hasUsefulLink(post) ? "linked" : "missing"}`}>{hasUsefulLink(post) ? "Source linked" : "Source missing"}</span>
                  </div>
                  <h3>{post.title || post.schemeName || "Untitled post"}</h3>
                  <p>{post.department || post.organization || "No department added"}</p>
                </div>
                <div className="post-actions"><Link href={publicLink(post)} target="_blank"><ExternalLink size={16}/>View</Link><Link href={editLink(post)}>Edit</Link></div>
              </article>
            ))}</div>
          )}
        </section>

        <section className="operations-panel"><h2>Website shortcuts</h2><div><a href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Search Console <ExternalLink size={15}/></a><a href="https://analytics.google.com" target="_blank" rel="noreferrer">Google Analytics <ExternalLink size={15}/></a><Link href="/sitemap.xml" target="_blank">Sitemap <ExternalLink size={15}/></Link><Link href="/robots.txt" target="_blank">Robots.txt <ExternalLink size={15}/></Link></div></section>
      </div>

      <style jsx global>{`
        .dashboard-stack{display:grid;gap:24px}.dashboard-welcome,.section-heading{display:flex;align-items:center;justify-content:space-between;gap:14px}.dashboard-welcome h2,.section-heading h2,.operations-panel h2{margin:0;color:#102a4c}.dashboard-welcome h2{font-size:24px}.dashboard-welcome p,.section-heading p{margin:5px 0 0;color:#64748b;font-size:14px}.dashboard-welcome button,.section-heading>a{min-height:42px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#17365f;padding:0 13px;display:inline-flex;align-items:center;gap:7px;text-decoration:none;font-weight:750}.dashboard-error{padding:14px;border:1px solid #fecaca;border-radius:10px;background:#fff1f2;color:#9f1239}.spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        .attention-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}.attention-card{min-height:92px;border:1px solid #e2e8f0;border-radius:13px;background:#fff;padding:16px;display:flex;align-items:center;gap:13px}.attention-card>div{display:flex;flex-direction:column;gap:4px}.attention-card span{font-size:12px;font-weight:750;color:#64748b}.attention-card strong{font-size:27px;line-height:1;color:#102a4c}.attention-card.urgent{color:#dc2626}.attention-card.exam{color:#2563eb}.attention-card.expired{color:#d97706}.attention-card.incomplete{color:#0f766e}
        .action-panel,.analytics-placeholder,.recent-panel,.operations-panel{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px}.action-list{display:grid;gap:8px;margin-top:14px}.action-list article{border:1px solid #e2e8f0;border-radius:10px;padding:12px 13px;display:flex;align-items:center;justify-content:space-between;gap:12px}.action-list h3{margin:4px 0;color:#172b4d;font-size:14px}.action-list p{margin:0;color:#64748b;font-size:12px}.action-tag{display:inline-flex;border-radius:999px;padding:3px 8px;font-size:10px;font-weight:850}.action-tag.red{background:#fff1f2;color:#be123c}.action-tag.blue{background:#eff6ff;color:#1d4ed8}.action-tag.amber{background:#fffbeb;color:#b45309}
        .analytics-placeholder{margin-top:12px;display:flex;align-items:center;gap:14px;color:#2563eb}.analytics-placeholder div{flex:1}.analytics-placeholder strong{color:#172b4d}.analytics-placeholder p{margin:4px 0 0;color:#64748b;font-size:13px}.analytics-placeholder a{padding:10px 13px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-weight:750;white-space:nowrap}
        .health-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px}.health-grid article{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:15px;display:flex;flex-direction:column;gap:5px}.health-grid article.needs-review{border-color:#fed7aa;background:#fffaf5}.health-grid article.legacy{border-color:#fde68a;background:#fffdf3}.health-grid span{font-size:12px;font-weight:800;color:#64748b}.health-grid strong{font-size:25px;line-height:1;color:#102a4c}.health-grid small{color:#64748b;line-height:1.35}.count-grid{display:grid;grid-template-columns:repeat(7,minmax(120px,1fr));gap:10px;margin-top:12px}.count-card{min-width:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:15px;text-decoration:none;color:#64748b;display:flex;flex-direction:column;gap:7px;box-shadow:0 2px 5px rgba(15,39,71,.03)}.count-card:hover{border-color:#93c5fd;box-shadow:0 8px 18px rgba(30,64,175,.07)}.count-card span{font-size:13px;font-weight:700;line-height:1.3}.count-card strong{font-size:28px;line-height:1;color:#102a4c}
        .quick-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.quick-grid a{min-height:48px;padding:0 14px;border:1px solid #d7e6fb;border-radius:10px;background:#eaf2ff;color:#174a8b;text-decoration:none;font-weight:750;display:flex;align-items:center;gap:9px}
        .dashboard-search{max-width:520px;margin:15px 0;min-height:44px;padding:0 12px;border:1px solid #cbd5e1;border-radius:9px;display:flex;align-items:center;gap:8px;color:#64748b}.dashboard-search input{width:100%;border:0;outline:0;font:inherit;background:transparent}.recent-list{display:grid;gap:9px}.recent-list article{border:1px solid #e2e8f0;border-radius:10px;padding:13px;display:flex;align-items:center;justify-content:space-between;gap:12px}.recent-list>article>div:first-child{min-width:0}.recent-badges{display:flex;align-items:center;flex-wrap:wrap;gap:6px}.recent-list .recent-badges>span:first-child{text-transform:capitalize;font-size:11px;font-weight:800;color:#2563eb}.lifecycle-badge,.source-badge{display:inline-flex;padding:3px 7px;border-radius:999px;font-size:10px!important;font-weight:850!important;text-transform:none!important}.lifecycle-badge.good{background:#ecfdf5;color:#047857!important}.lifecycle-badge.warn{background:#fff1f2;color:#be123c!important}.lifecycle-badge.info{background:#eff6ff;color:#1d4ed8!important}.lifecycle-badge.neutral{background:#f1f5f9;color:#475569!important}.source-badge.linked{background:#f0fdf4;color:#15803d!important}.source-badge.missing{background:#fff7ed;color:#c2410c!important}.recent-list h3{font-size:15px;margin:4px 0;color:#172b4d}.recent-list p{font-size:12px;margin:0;color:#64748b}.post-actions{display:flex;gap:7px}.post-actions a{min-height:38px;padding:0 11px;border-radius:8px;background:#eff6ff;color:#1d4ed8;text-decoration:none;font-weight:750;display:flex;align-items:center;gap:5px}.empty-state{color:#64748b}
        .operations-panel h2{font-size:18px}.operations-panel>div{display:flex;flex-wrap:wrap;gap:9px;margin-top:12px}.operations-panel a{min-height:40px;padding:0 12px;border:1px solid #dbe3ed;border-radius:8px;color:#17365f;text-decoration:none;display:flex;align-items:center;gap:6px;font-weight:700}
        @media(max-width:1150px){.attention-grid{grid-template-columns:repeat(2,1fr)}.health-grid{grid-template-columns:repeat(2,1fr)}.count-grid{grid-template-columns:repeat(4,1fr)}}
        @media(max-width:700px){.dashboard-stack{gap:20px}.dashboard-welcome{align-items:flex-start}.dashboard-welcome h2{font-size:20px}.dashboard-welcome p{line-height:1.45}.dashboard-welcome button{font-size:0;padding:0;width:44px;flex:0 0 44px;justify-content:center}.section-heading h2{font-size:20px}.attention-grid{grid-template-columns:1fr 1fr}.attention-card{min-height:82px;padding:13px}.action-list article{align-items:flex-start;flex-direction:column}.analytics-placeholder{align-items:flex-start;flex-wrap:wrap;padding:16px}.analytics-placeholder div{min-width:calc(100% - 48px)}.analytics-placeholder a{width:100%;text-align:center}.health-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.count-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.count-card{padding:14px}.count-card strong{font-size:25px}.quick-grid{grid-template-columns:1fr 1fr}.quick-grid a{padding:8px 12px;line-height:1.3}.recent-panel,.operations-panel,.action-panel{padding:16px}.recent-list article{align-items:flex-start;flex-direction:column}.post-actions{width:100%}.post-actions a{flex:1;justify-content:center}.operations-panel>div{display:grid;grid-template-columns:1fr 1fr}.operations-panel a{justify-content:center;text-align:center}}
        @media(max-width:420px){.attention-grid{grid-template-columns:1fr}.health-grid{grid-template-columns:1fr}.quick-grid{grid-template-columns:1fr}.operations-panel>div{grid-template-columns:1fr}.section-heading{align-items:flex-start}.section-heading>a{white-space:nowrap}}
      `}</style>
    </AdminLayout>
  );
}
