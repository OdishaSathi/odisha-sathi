import type { Metadata } from "next";
import { generateSectionPostMetadata } from "@/lib/sectionMetadata";

type AdmitCardsLayoutProps = {
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
    category: "admit-cards",
    slugOrId: subCategory,
    routeBase: "/admit-cards",
  });
}

export default function AdmitCardsDetailLayout({
  children,
}: AdmitCardsLayoutProps) {
  return <>{children}</>;
}