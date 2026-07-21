"use client";

import Link from "next/link";
import { BarChart3, CheckCircle2, ExternalLink, LockKeyhole } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminAnalyticsPage() {
  return (
    <AdminLayout>
      <div className="analytics-page">
        <section className="setup-card">
          <BarChart3 size={38}/><div><h2>Connect Google Analytics 4</h2><p>Visitor tracking is not connected. Once configured, this page will show genuine visitor and page-view data. It will never use a Firestore counter or estimated numbers.</p></div>
        </section>
        <section className="security-card"><LockKeyhole size={24}/><div><h3>Secure connection required</h3><p>The GA4 reporting credential must remain on the Vercel server. Do not paste a service-account private key into public Firebase settings or any <code>NEXT_PUBLIC_</code> variable.</p></div></section>
        <section className="steps-card"><h2>Information needed for setup</h2><ol><li><CheckCircle2 size={18}/><span>A Google Analytics 4 property for <strong>odishasathi.in</strong></span></li><li><CheckCircle2 size={18}/><span>The GA4 Measurement ID beginning with <strong>G-</strong></span></li><li><CheckCircle2 size={18}/><span>The numeric GA4 Property ID for reporting</span></li><li><CheckCircle2 size={18}/><span>A Google Cloud service account granted Viewer access to that GA4 property</span></li></ol><a href="https://analytics.google.com" target="_blank" rel="noreferrer">Open Google Analytics <ExternalLink size={16}/></a></section>
        <p className="back"><Link href="/admin">← Return to dashboard</Link></p>
      </div>
      <style jsx>{`.analytics-page{max-width:900px;display:grid;gap:16px}.setup-card,.security-card,.steps-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:20px}.setup-card,.security-card{display:flex;gap:15px;align-items:flex-start}.setup-card{color:#2563eb}.setup-card div,.security-card div{color:#172b4d}.setup-card h2,.security-card h3,.steps-card h2{margin:0 0 7px}.setup-card p,.security-card p{margin:0;color:#64748b;line-height:1.6}.security-card{background:#fffbeb;border-color:#fde68a;color:#b45309}.steps-card ol{list-style:none;padding:0;margin:16px 0;display:grid;gap:12px}.steps-card li{display:flex;align-items:flex-start;gap:9px;color:#334155}.steps-card li :global(svg){color:#16a34a;flex:none}.steps-card>a{display:inline-flex;align-items:center;gap:7px;padding:11px 14px;border-radius:8px;background:#2563eb;color:#fff;text-decoration:none;font-weight:750}.back a{color:#1d4ed8;text-decoration:none}@media(max-width:600px){.setup-card,.security-card{flex-direction:column}.steps-card{padding:16px}}`}</style>
    </AdminLayout>
  );
}
