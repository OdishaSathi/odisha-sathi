import Link from "next/link";

const helpfulLinks = [
  { label: "Latest Jobs", href: "/jobs" },
  { label: "Admissions", href: "/admissions" },
  { label: "Admit Cards & Exams", href: "/admit-cards" },
  { label: "Results", href: "/results" },
  { label: "Schemes", href: "/schemes" },
  { label: "Search", href: "/search" },
];

export default function NotFound() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Page Not Found</h1>
          <p>The page you are looking for may have been moved, updated, or removed.</p>
        </div>
      </section>

      <section className="section container">
        <article className="article trust-article">
          <h2>Find the update you need</h2>
          <p>
            Use the links below to open important Odisha Sathi sections, or use
            search to find a specific job, admission, result, scheme, admit card
            or exam update.
          </p>
          <div className="trust-action-row">
            {helpfulLinks.map((item) => (
              <Link key={item.href} className="btn outline" href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
