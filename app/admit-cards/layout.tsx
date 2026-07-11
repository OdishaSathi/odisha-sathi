import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admit Cards & Exams",
  description:
    "Get latest admit cards, exam dates, exam city information, syllabus, exam pattern and exam updates on Odisha Sathi.",
  alternates: { canonical: "/admit-cards" },
};

export default function AdmitCardsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
