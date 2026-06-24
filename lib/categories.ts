import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export default function CategoryPills() {
  return (
    <div className="category-grid-fixed">
      {siteConfig.homeCategories.map((item, index) => (
        <Link key={item.label} href={item.href} className="category-card-fixed">
          <span className="category-number">{index + 1}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  );
}