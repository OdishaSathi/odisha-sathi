import Link from "next/link";
import { categories } from "@/lib/categories";

export default function CategoryPills() {
  return (
    <div className="category-pills">
      {categories.map((cat) => (
        <Link key={cat.value} href={`/category/${cat.value}`}>{cat.label}</Link>
      ))}
    </div>
  );
}
