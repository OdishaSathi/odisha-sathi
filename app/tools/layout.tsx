import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tools",
  description:
    "Use Odisha Sathi tools and quick links for PDF tools, image tools and useful online services.",
  alternates: { canonical: "/tools" },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
