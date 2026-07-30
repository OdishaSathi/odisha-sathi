"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  FileText,
  GraduationCap,
  Home,
  Info,
  LayoutGrid,
  Settings,
  ShieldCheck,
  Tags,
  X,
} from "lucide-react";

const menuGroups = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", icon: Home },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { label: "Homepage Posts", href: "/admin/homepage-posts", icon: LayoutGrid },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Jobs", href: "/admin/jobs", icon: BriefcaseBusiness },
      { label: "Results", href: "/admin/results", icon: FileText },
      { label: "Admissions & Scholarships", href: "/admin/admissions", icon: GraduationCap },
      { label: "Admit Cards & Exams", href: "/admin/admit-cards", icon: ShieldCheck },
      { label: "Citizen Services", href: "/admin/citizen-services", icon: LayoutGrid },
      { label: "Important Info", href: "/admin/important-information", icon: Info },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Sub Categories", href: "/admin/categories", icon: Tags },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

type AdminSidebarProps = {
  open?: boolean;
  onClose?: () => void;
};

export default function AdminSidebar({ open = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close admin menu"
        className={`admin-sidebar-backdrop ${open ? "is-open" : ""}`}
        onClick={onClose}
      />
      <aside className={`admin-sidebar ${open ? "is-open" : ""}`} aria-label="Admin navigation">
        <div className="admin-sidebar-brand">
          <div>
            <h2>Odisha Sathi</h2>
            <p>Admin Panel</p>
          </div>
          <button type="button" className="admin-sidebar-close" onClick={onClose} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {menuGroups.map((group) => (
            <div className="admin-sidebar-group" key={group.label}>
              <p className="admin-sidebar-group-label">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`admin-sidebar-link ${isActive(item.href) ? "admin-sidebar-link-active" : ""}`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
