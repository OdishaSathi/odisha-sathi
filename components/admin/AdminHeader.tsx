"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/admin": {
    title: "Dashboard",
    subtitle: "Overview of website content",
  },
  "/admin/jobs": {
    title: "Jobs",
    subtitle: "Saved posts and quick job update entry",
  },
  "/admin/results": {
    title: "Results",
    subtitle: "Saved results and result update entry",
  },
  "/admin/admissions": {
    title: "Admissions",
    subtitle: "Saved admissions and admission update entry",
  },
  "/admin/admit-cards": {
    title: "Admit Cards & Exams",
    subtitle: "Saved admit card and exam updates",
  },
  "/admin/schemes": {
    title: "Schemes",
    subtitle: "Saved schemes and scheme update entry",
  },
  "/admin/important-information": {
    title: "Important Information",
    subtitle: "Homepage important tiles and information detail pages",
  },
  "/admin/tools": {
    title: "Tools",
    subtitle: "Saved tool links and new tool entry",
  },
  "/admin/categories": {
    title: "Sub Categories",
    subtitle: "Safe subcategory planning and overview",
  },
  "/admin/settings": {
    title: "Settings",
    subtitle: "Website, social, homepage and sharing defaults",
  },
};

function getPageTitle(pathname: string) {
  const exactMatch = pageTitles[pathname];

  if (exactMatch) return exactMatch;

  const sectionPath = Object.keys(pageTitles)
    .filter((item) => item !== "/admin")
    .find((item) => pathname.startsWith(`${item}/`));

  return sectionPath ? pageTitles[sectionPath] : pageTitles["/admin"];
}

export default function AdminHeader() {
  const pathname = usePathname();
  const pageInfo = getPageTitle(pathname || "/admin");

  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="admin-header">
      <div className="admin-header-text">
        <h2>{pageInfo.title}</h2>
        <p>{pageInfo.subtitle}</p>
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
