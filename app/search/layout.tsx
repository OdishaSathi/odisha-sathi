import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Odisha Sathi jobs, admissions, results, exams, important information and citizen services.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
