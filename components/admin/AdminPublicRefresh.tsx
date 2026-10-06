"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";

export default function AdminPublicRefresh() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);

  async function refreshPublicWebsite() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setFailed(false);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please sign in again.");
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/refresh-public", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Refresh failed. Please retry.");
      }
      setMessage("Refresh requested. Public pages rebuild when next visited. Open or reload the public page to check.");
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "Refresh failed. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="public-refresh" aria-label="Public website cache">
      <div>
        <p>After saving posts or settings, refresh the public website once.</p>
        {message && <p role={failed ? "alert" : "status"} className={failed ? "error" : "result"}>{message}</p>}
      </div>
      <button type="button" onClick={refreshPublicWebsite} disabled={busy}>
        {busy ? "Requesting refresh…" : "Refresh public website"}
      </button>
      <style jsx>{`
        .public-refresh{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 14px;margin-bottom:18px;border:1px solid #dbe3ed;border-radius:10px;background:#fff}
        .public-refresh>div{flex:1 1 260px;min-width:0}
        p{margin:0;font-size:13px;line-height:1.5;color:#475569;overflow-wrap:anywhere}
        p.result,p.error{margin-top:6px}.result{color:#166534}.error{color:#b91c1c}
        button{min-height:44px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;color:#17365f;padding:9px 14px;font-weight:700;cursor:pointer;white-space:normal}
        button:disabled{opacity:.6;cursor:wait}
        @media(max-width:640px){button{width:100%}}
      `}</style>
    </section>
  );
}
