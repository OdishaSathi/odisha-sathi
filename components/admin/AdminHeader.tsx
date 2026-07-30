"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogOut, Menu } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/analytics": "Visitor Analytics",
  "/admin/jobs": "Jobs",
  "/admin/results": "Results",
  "/admin/admissions": "Admissions",
  "/admin/admit-cards": "Admit Cards & Exams",
  "/admin/citizen-services": "Citizen Services",
  "/admin/homepage-posts": "Homepage Latest Posts",
  "/admin/important-information": "Important Information",
  "/admin/categories": "Sub Categories",
  "/admin/settings": "Settings",
};

function getTitle(pathname: string) {
  if (pageTitles[pathname]) return pageTitles[pathname];
  return pageTitles[Object.keys(pageTitles).find((path) => path !== "/admin" && pathname.startsWith(`${path}/`)) || "/admin"];
}

type Props = {
  email?: string | null;
  loggingOut?: boolean;
  onMenu: () => void;
  onLogout: () => void;
};

export default function AdminHeader({ email, loggingOut, onMenu, onLogout }: Props) {
  const pathname = usePathname();

  return (
    <header className="admin-header">
      <button type="button" className="admin-menu-button" onClick={onMenu} aria-label="Open admin menu">
        <Menu size={22} />
      </button>
      <div className="admin-header-text">
        <h1>{getTitle(pathname || "/admin")}</h1>
        <p>{email || "Administrator"}</p>
      </div>
      <div className="admin-header-actions">
        <Link href="/" target="_blank" title="Open public website">
          <ExternalLink size={18} /><span>View Website</span>
        </Link>
        <button type="button" onClick={onLogout} disabled={loggingOut} title="Log out">
          <LogOut size={18} /><span>{loggingOut ? "Logging out" : "Logout"}</span>
        </button>
      </div>
    </header>
  );
}
