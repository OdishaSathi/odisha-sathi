import Link from "next/link";

const categories = [
  {
    title: "PDF Tools",
    href: "/tools/pdf-tools",
  },
  {
    title: "Image Tools",
    href: "/tools/image-tools",
  },
];

export default function ToolsPage() {
  return (
    <main className="tools-page-main">
      <section className="tools-page-head">
        <p className="tools-breadcrumb">
          <Link href="/">Home</Link> / Tools
        </p>

        <h1>Tools</h1>
      </section>

      <section className="tools-category-grid">
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="tools-category-card"
          >
            <h2>{category.title}</h2>
          </Link>
        ))}
      </section>
    </main>
  );
}