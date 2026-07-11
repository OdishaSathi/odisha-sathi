import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Government Schemes",
  description:
    "Find Odisha and central government scheme updates, scholarships, eligibility, application details and official links on Odisha Sathi.",
  alternates: { canonical: "/schemes" },
};

export default function SchemesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
