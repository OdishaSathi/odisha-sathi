import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export default function CategoryPills() {
  return (
    <div className="category-pill-grid">
      {siteConfig.homeCategories.map((item) => (
        <Link key={item.label} href={item.href} className="category-pill">
          {item.label}
        </Link>
      ))}
    </div>
  );
}