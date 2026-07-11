import type { Metadata } from "next";
import { generateSectionPostMetadata } from "@/lib/sectionMetadata";

type ResultsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    subCategory: string;
  }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subCategory: string }>;
}): Promise<Metadata> {
  const { subCategory } = await params;

  return generateSectionPostMetadata({
    category: "results",
    slugOrId: subCategory,
    routeBase: "/results",
  });
}

export default function ResultsDetailLayout({ children }: ResultsLayoutProps) {
  return <>{children}</>;
}