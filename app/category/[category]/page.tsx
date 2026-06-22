import Link from "next/link";
import CategoryPosts from "@/components/CategoryPosts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function titleFromCategory(category: string) {
  const text = category.replace(/-/g, " ");

  if (category === "jobs") return "Jobs";
  if (category === "exams") return "Exams";
  if (category === "results") return "Results";
  if (category === "scholarships") return "Scholarships";
  if (category === "schemes") return "Government Schemes";
  if (category === "govt-schemes") return "Government Schemes";
  if (category === "admissions") return "Admissions";

  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default async function CategoryPage({
  params
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  return (
    <section className="section container">
      <div className="section-title">
        <div>
          <p><Link href="/">Home</Link> / Category</p>
          <h1>{titleFromCategory(category)}</h1>
          <p>Latest published updates from this category.</p>
        </div>
      </div>

      <CategoryPosts category={category} />
    </section>
  );
}