import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Sitemap",
  description:
    "Sitemap for Odisha Sathi with main sections, important pages and user-friendly links.",
  alternates: { canonical: "/sitemap" },
};

const sitemapGroups = [
  {
    title: "Main Sections",
    links: siteConfig.footerMainLinks,
  },
  {
    title: "Important Pages",
    links: siteConfig.footerTrustLinks.filter((item) => item.href !== "/sitemap"),
  },
  {
    title: "Other Useful Pages",
    links: [
      { label: "Home", href: "/" },
      { label: "Search", href: "/search" },
      { label: "Important Information", href: "/#important-information" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Sitemap</h1>
          <p>
            Find important Odisha Sathi pages and sections from one place.
          </p>
        </div>
      </section>

      <section className="section container">
        <div className="article trust-article">
          <div className="sitemap-grid">
            {sitemapGroups.map((group) => (
              <section className="sitemap-card" key={group.title}>
                <h2>{group.title}</h2>
                <div className="footer-links sitemap-links">
                  {group.links.map((item) => (
                    <Link key={item.href} href={item.href}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
