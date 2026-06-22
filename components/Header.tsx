import Link from "next/link";
import { categories } from "@/lib/categories";

export default function Header() {
  return (
    <header className="site-header">
      <div className="top-strip">Daily updates on Govt. Jobs • Exams • Results • Scholarships • Govt. Schemes</div>
      <nav className="navbar container">
        <Link href="/" className="brand">
          <span className="brand-mark">OS</span>
          <span>
            <strong>Odisha Sathi</strong>
            <small>ଓଡିଶା ସାଥି</small>
          </span>
        </Link>
        <div className="nav-links">
          {categories.slice(0, 5).map((cat) => (
            <Link key={cat.value} href={`/category/${cat.value}`}>{cat.label}</Link>
          ))}
          <Link href="/tools">Tools</Link>
          <Link href="/admin" className="admin-link">Admin</Link>
        </div>
      </nav>
    </header>
  );
}
