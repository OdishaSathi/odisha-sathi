"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Jobs", href: "/admin/jobs" },
  { label: "Results", href: "/admin/results" },
  { label: "Admissions", href: "/admin/admissions" },
  { label: "Admit Cards", href: "/admin/admit-cards" },
  { label: "Schemes", href: "/admin/schemes" },
  { label: "Tools", href: "/admin/tools" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Settings", href: "/admin/settings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-brand">
        <h2>Odisha Sathi</h2>
        <p>Admin Panel</p>
      </div>

      <nav className="admin-sidebar-nav">
        {menuItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-sidebar-link ${
                active ? "admin-sidebar-link-active" : ""
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}