import type { Metadata } from "next";
import { generateSectionPostMetadata } from "@/lib/sectionMetadata";

type AdmissionsLayoutProps = {
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
    category: "admissions",
    slugOrId: subCategory,
    routeBase: "/admissions",
  });
}

export default function AdmissionsDetailLayout({
  children,
}: AdmissionsLayoutProps) {
  return <>{children}</>;
}