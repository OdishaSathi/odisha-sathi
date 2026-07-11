import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Odisha Sathi posts, jobs, admissions, results, schemes and tools.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
