"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type NavItem = { id: string; label: string };

function slugify(value: string, index: number) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `admin-form-${base || "section"}-${index + 1}`;
}

export default function AdminFormNavigator() {
  const pathname = usePathname();
  const [items, setItems] = useState<NavItem[]>([]);

  useEffect(() => {
    let frame = 0;

    const scan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const form = document.querySelector(".admin-layout-content form");
        if (!form) {
          setItems([]);
          return;
        }

        form.classList.add("admin-compact-form");

        const candidates = Array.from(
          form.querySelectorAll<HTMLElement>("section, [data-admin-section]")
        );
        const seen = new Set<HTMLElement>();
        const next: NavItem[] = [];

        candidates.forEach((section, index) => {
          if (seen.has(section)) return;
          seen.add(section);

          const heading = section.querySelector<HTMLElement>(
            ":scope > h2, :scope > h3, :scope > div > h2, :scope > div > h3, :scope > summary"
          );
          const raw = heading?.textContent?.replace(/\s+/g, " ").trim() || "";
          if (!raw || raw.length > 80) return;

          if (!section.id) section.id = slugify(raw, index);
          section.style.scrollMarginTop = "136px";
          next.push({ id: section.id, label: raw.replace(/\d+$/, "").trim() });
        });

        const unique = next.filter(
          (item, index, list) =>
            list.findIndex((candidate) => candidate.label === item.label) === index
        );
        setItems(unique.slice(0, 14));
      });
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", scan);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", scan);
    };
  }, [pathname]);

  if (items.length < 2) return null;

  return (
    <nav className="admin-form-navigator" aria-label="Form sections">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        title="Back to top"
      >
        ↑ Top
      </button>
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          onClick={() =>
            document.getElementById(item.id)?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }
        >
          {item.label}
        </button>
      ))}
      <style jsx>{`
        .admin-form-navigator{position:sticky;top:84px;z-index:32;display:flex;align-items:center;gap:6px;width:100%;margin:0 0 12px;padding:7px;border:1px solid #dbe3ee;border-radius:11px;background:rgba(255,255,255,.96);box-shadow:0 6px 18px rgba(15,39,71,.07);overflow-x:auto;scrollbar-width:thin;backdrop-filter:blur(10px)}
        button{flex:0 0 auto;min-height:32px;border:1px solid #dbe3ee;border-radius:999px;padding:6px 10px;background:#f8fafc;color:#17365f;font-size:11.5px;font-weight:850;cursor:pointer;white-space:nowrap}button:hover{border-color:#bfdbfe;background:#eff6ff;color:#1d4ed8}
        @media(max-width:900px){.admin-form-navigator{top:65px;margin:0 -1px 9px;width:calc(100% + 2px);padding:5px;border-radius:9px;gap:4px;scroll-snap-type:x proximity}button{min-height:32px;padding:5px 8px;font-size:10.5px;scroll-snap-align:start}}
      `}</style>
    </nav>
  );
}
