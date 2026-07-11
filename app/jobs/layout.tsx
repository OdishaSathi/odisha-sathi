import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Latest Jobs",
  description:
    "Find latest Odisha jobs, central jobs, recruitment updates, eligibility, important dates and official links on Odisha Sathi.",
  alternates: { canonical: "/jobs" },
};

export default function JobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
