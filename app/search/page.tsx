import SearchResultsClient from "@/components/public/SearchResultsClient";
import { searchPublicRecords } from "@/lib/publicSearch";

export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string | string[] }>;
}) {
  const params = (await searchParams) || {};
  const rawQuery = Array.isArray(params.q) ? params.q[0] || "" : params.q || "";
  const query = String(rawQuery).trim().slice(0, 120);
  const results = query ? await searchPublicRecords(query) : [];

  return <SearchResultsClient query={query} results={results} />;
}
