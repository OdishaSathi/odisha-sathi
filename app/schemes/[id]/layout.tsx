import type { Metadata } from "next";
import { generateSectionPostMetadata } from "@/lib/sectionMetadata";

type SchemesLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return generateSectionPostMetadata({
    category: "schemes",
    slugOrId: id,
    routeBase: "/schemes",
  });
}

export default function SchemesDetailLayout({ children }: SchemesLayoutProps) {
  return <>{children}</>;
}