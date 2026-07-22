"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { BarChart3, ExternalLink, FilePlus2, RefreshCw, Search } from "lucide-react";
import { db } from "@/lib/firebase";
import AdminLayout from "@/components/admin/AdminLayout";

type AdminPost = { id: string; title: string; slug?: string; category?: string; schemeName?: string; department?: string; createdAt?: any };
const categories = [
  ["jobs", "Jobs", "/admin/jobs"], ["results", "Results", "/admin/results"],
  ["admissions", "Admissions", "/admin/admissions"], ["admit-cards", "Exams", "/admin/admit-cards"],
  ["schemes", "Schemes", "/admin/schemes"], ["tools", "Tools", "/admin/tools"],
] as const;

function publicLink(post: AdminPost) { return post.category === "schemes" ? `/schemes/${post.id}` : `/post/${post.slug || post.id}`; }
function editLink(post: AdminPost) {
  const map: Record<string, string> = { jobs: "jobs/edit", results: "results", admissions: "admissions/edit", "admit-cards": "admit-cards/edit", schemes: "schemes/edit", tools: "tools" };
  return `/admin/${map[post.category || ""] || ""}/${post.id}`;
}
function timeValue(value: any) { return value?.toMillis?.() || value?.seconds * 1000 || 0; }

export default function AdminDashboardPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [importantCount, setImportantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const [postSnapshot, infoSnapshot] = await Promise.all([
        getDocs(collection(db, "posts")), getDocs(collection(db, "importantInformation")),
      ]);
      setPosts(postSnapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Omit<AdminPost, "id">) })).sort((a,b) => timeValue(b.createdAt)-timeValue(a.createdAt)));
      setImportantCount(infoSnapshot.size);
    } catch (err) { console.error(err); setError("Dashboard data could not be loaded. Check your connection and Firestore permissions."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const visiblePosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return posts.filter((p) => !term || `${p.title} ${p.schemeName} ${p.department} ${p.category}`.toLowerCase().includes(term)).slice(0, 10);
  }, [posts, search]);
  const contentPosts = posts.filter((p) => categories.some(([key]) => key === p.category));

  return (
    <AdminLayout>
      <div className="dashboard-stack">
        <section className="dashboard-welcome">
          <div><h2>Website overview</h2><p>Manage content, check recent posts and open important website tools.</p></div>
          <button type="button" onClick={() => void loadDashboard()} disabled={loading}><RefreshCw size={17} className={loading ? "spin" : ""}/>{loading ? "Refreshing" : "Refresh"}</button>
        </section>

        {error ? <div className="dashboard-error" role="alert">{error}</div> : null}

        <section>
          <div className="section-heading"><div><h2>Visitor analytics</h2><p>Google Analytics connection status</p></div><Link href="/admin/analytics">Open Analytics</Link></div>
          <div className="analytics-placeholder">
            <BarChart3 size={30}/><div><strong>GA4 visitor dashboard</strong><p>View active visitors, today, 7-day and 30-day totals, popular pages and devices.</p></div><Link href="/admin/analytics">View report</Link>
          </div>
        </section>

        <section>
          <div className="section-heading"><div><h2>Content totals</h2><p>{contentPosts.length + importantCount} managed items</p></div></div>
          <div className="count-grid">
            {categories.map(([key,label,href]) => <Link href={href} className="count-card" key={key}><span>{label}</span><strong>{loading ? "—" : posts.filter((p)=>p.category===key).length}</strong></Link>)}
            <Link href="/admin/important-information" className="count-card"><span>Important Info</span><strong>{loading ? "—" : importantCount}</strong></Link>
          </div>
        </section>

        <section>
          <div className="section-heading"><div><h2>Quick create</h2><p>Jump directly to a content section</p></div></div>
          <div className="quick-grid">
            {categories.slice(0,5).map(([key,label,href]) => <Link key={key} href={href}><FilePlus2 size={18}/>New {label}</Link>)}
            <Link href="/admin/important-information"><FilePlus2 size={18}/>New Important Info</Link>
          </div>
        </section>

        <section className="recent-panel">
          <div className="section-heading"><div><h2>Recent posts</h2><p>Search and open your latest saved content</p></div></div>
          <label className="dashboard-search"><Search size={18}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search title, department or category…" /></label>
          {loading ? <p className="empty-state">Loading recent posts…</p> : visiblePosts.length === 0 ? <p className="empty-state">No matching posts found.</p> : (
            <div className="recent-list">{visiblePosts.map((post) => {
              const title = post.category === "schemes" ? post.schemeName || post.title : post.title;
              return <article key={post.id}><div><span>{post.category || "post"}</span><h3>{title || "Untitled post"}</h3><p>{post.department || "No department added"}</p></div><div className="post-actions"><Link href={publicLink(post)} target="_blank"><ExternalLink size={16}/>View</Link><Link href={editLink(post)}>Edit</Link></div></article>;
            })}</div>
          )}
        </section>

        <section className="operations-panel"><h2>Website shortcuts</h2><div><a href="https://search.google.com/search-console" target="_blank" rel="noreferrer">Search Console <ExternalLink size={15}/></a><a href="https://analytics.google.com" target="_blank" rel="noreferrer">Google Analytics <ExternalLink size={15}/></a><Link href="/sitemap.xml" target="_blank">Sitemap <ExternalLink size={15}/></Link><Link href="/robots.txt" target="_blank">Robots.txt <ExternalLink size={15}/></Link></div></section>
      </div>
      <style jsx global>{`
        .dashboard-stack{display:grid;gap:24px}.dashboard-welcome,.section-heading{display:flex;align-items:center;justify-content:space-between;gap:14px}.dashboard-welcome h2,.section-heading h2,.operations-panel h2{margin:0;color:#102a4c}.dashboard-welcome h2{font-size:24px}.dashboard-welcome p,.section-heading p{margin:5px 0 0;color:#64748b;font-size:14px}.dashboard-welcome button,.section-heading>a{min-height:42px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#17365f;padding:0 13px;display:inline-flex;align-items:center;gap:7px;text-decoration:none;font-weight:750}.dashboard-error{padding:14px;border:1px solid #fecaca;border-radius:10px;background:#fff1f2;color:#9f1239}.spin{animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        .analytics-placeholder,.recent-panel,.operations-panel{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px}.analytics-placeholder{margin-top:12px;display:flex;align-items:center;gap:14px;color:#2563eb}.analytics-placeholder div{flex:1}.analytics-placeholder strong{color:#172b4d}.analytics-placeholder p{margin:4px 0 0;color:#64748b;font-size:13px}.analytics-placeholder a{padding:10px 13px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-weight:750;white-space:nowrap}
        .count-grid{display:grid;grid-template-columns:repeat(7,minmax(120px,1fr));gap:10px;margin-top:12px}.count-card{min-width:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:15px;text-decoration:none;color:#64748b;display:flex;flex-direction:column;gap:7px;box-shadow:0 2px 5px rgba(15,39,71,.03)}.count-card:hover{border-color:#93c5fd;box-shadow:0 8px 18px rgba(30,64,175,.07)}.count-card span{font-size:13px;font-weight:700;line-height:1.3}.count-card strong{font-size:28px;line-height:1;color:#102a4c}
        .quick-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}.quick-grid a{min-height:48px;padding:0 14px;border:1px solid #d7e6fb;border-radius:10px;background:#eaf2ff;color:#174a8b;text-decoration:none;font-weight:750;display:flex;align-items:center;gap:9px}
        .dashboard-search{max-width:520px;margin:15px 0;min-height:44px;padding:0 12px;border:1px solid #cbd5e1;border-radius:9px;display:flex;align-items:center;gap:8px;color:#64748b}.dashboard-search input{width:100%;border:0;outline:0;font:inherit;background:transparent}.recent-list{display:grid;gap:9px}.recent-list article{border:1px solid #e2e8f0;border-radius:10px;padding:13px;display:flex;align-items:center;justify-content:space-between;gap:12px}.recent-list span{text-transform:capitalize;font-size:11px;font-weight:800;color:#2563eb}.recent-list h3{font-size:15px;margin:4px 0;color:#172b4d}.recent-list p{font-size:12px;margin:0;color:#64748b}.post-actions{display:flex;gap:7px}.post-actions a{min-height:38px;padding:0 11px;border-radius:8px;background:#eff6ff;color:#1d4ed8;text-decoration:none;font-weight:750;display:flex;align-items:center;gap:5px}.empty-state{color:#64748b}
        .operations-panel h2{font-size:18px}.operations-panel>div{display:flex;flex-wrap:wrap;gap:9px;margin-top:12px}.operations-panel a{min-height:40px;padding:0 12px;border:1px solid #dbe3ed;border-radius:8px;color:#17365f;text-decoration:none;display:flex;align-items:center;gap:6px;font-weight:700}
        @media(max-width:1150px){.count-grid{grid-template-columns:repeat(4,1fr)}}@media(max-width:700px){.dashboard-stack{gap:20px}.dashboard-welcome{align-items:flex-start}.dashboard-welcome h2{font-size:20px}.dashboard-welcome p{line-height:1.45}.dashboard-welcome button{font-size:0;padding:0;width:44px;flex:0 0 44px;justify-content:center}.section-heading h2{font-size:20px}.analytics-placeholder{align-items:flex-start;flex-wrap:wrap;padding:16px}.analytics-placeholder div{min-width:calc(100% - 48px)}.analytics-placeholder a{width:100%;text-align:center}.count-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.count-card{padding:14px}.count-card strong{font-size:25px}.quick-grid{grid-template-columns:1fr 1fr}.quick-grid a{padding:8px 12px;line-height:1.3}.recent-panel,.operations-panel{padding:16px}.recent-list article{align-items:flex-start;flex-direction:column}.post-actions{width:100%}.post-actions a{flex:1;justify-content:center}.operations-panel>div{display:grid;grid-template-columns:1fr 1fr}.operations-panel a{justify-content:center;text-align:center}}
        @media(max-width:420px){.quick-grid{grid-template-columns:1fr}.operations-panel>div{grid-template-columns:1fr}.section-heading{align-items:flex-start}.section-heading>a{white-space:nowrap}}
      `}</style>
    </AdminLayout>
  );
}
