"use client";

import Link from "next/link";

export default function AdminHeader() {
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="admin-header">
      <div className="admin-header-text">
        <h2>Dashboard</h2>
        <p>Manage posts and categories</p>
      </div>

      <div className="admin-header-actions">
        <span>{today}</span>

        <Link href="/" target="_blank" className="admin-view-site-btn">
          View Website
        </Link>
      </div>
    </header>
  );
}