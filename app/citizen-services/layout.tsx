import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Citizen Services",
  description:
    "Citizen service guides, required documents, eligibility, fees, application process and official links from Odisha Sathi.",
  alternates: {
    canonical: "/citizen-services",
  },
};

export default function CitizenServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
