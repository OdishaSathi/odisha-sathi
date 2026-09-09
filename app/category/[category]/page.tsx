import { notFound, redirect } from "next/navigation";

function getCanonicalCategoryRoute(value: string) {
  const category = decodeURIComponent(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (category.includes("job")) return "/jobs";
  if (category.includes("result")) return "/results";
  if (category.includes("admission")) return "/admissions";
  if (category.includes("scholar") || category.includes("scheme")) return "/schemes";
  if (category.includes("exam") || category.includes("admit")) return "/admit-cards";
  if (category.includes("citizen")) return "/citizen-services";
  if (category.includes("tool")) return "/tools";

  return "";
}

export default async function LegacyCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const destination = getCanonicalCategoryRoute(category);

  if (!destination) {
    notFound();
  }

  redirect(destination);
}
