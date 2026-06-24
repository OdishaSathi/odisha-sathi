import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || "";

  return (
    <section className="section container">
      <div className="section-heading-row">
        <div>
          <p>
            <Link href="/">Home</Link> / Search
          </p>
          <h1>Search Odisha Sathi</h1>
          <p>
            You searched for: <strong>{query || "No search keyword"}</strong>
          </p>
        </div>
      </div>

      <div className="notice">
        Search result display will be connected with Firebase posts in the next upgrade phase.
      </div>
    </section>
  );
}