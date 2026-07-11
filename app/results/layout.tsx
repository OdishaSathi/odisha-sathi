import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Results",
  description:
    "Find latest Odisha results, board results, university results, recruitment results, merit lists and selection updates on Odisha Sathi.",
  alternates: { canonical: "/results" },
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
