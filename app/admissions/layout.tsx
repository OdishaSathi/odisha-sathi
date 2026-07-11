import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admissions",
  description:
    "Get latest Odisha admission updates, application dates, admission notices, eligibility details and official links on Odisha Sathi.",
  alternates: { canonical: "/admissions" },
};

export default function AdmissionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
