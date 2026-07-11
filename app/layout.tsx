import type { Metadata } from "next";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import StructuredData from "@/components/StructuredData";

export const metadata: Metadata = {
  metadataBase: new URL("https://odishasathi.in"),
  title: {
    default: "Odisha Sathi – Odisha Jobs, Exams, Results, Admissions & Schemes",
    template: "%s | Odisha Sathi",
  },
  description:
    "Odisha Sathi provides latest Odisha jobs, exams, results, admissions, scholarships, government schemes, useful tools and online services.",
  applicationName: "Odisha Sathi",
  authors: [{ name: "Odisha Sathi" }],
  creator: "Odisha Sathi",
  publisher: "Odisha Sathi",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  keywords: [
    "Odisha jobs",
    "Odisha exams",
    "Odisha results",
    "Odisha admissions",
    "Odisha scholarships",
    "Odisha govt schemes",
    "Odisha Sathi",
    "online works",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://odishasathi.in",
    siteName: "Odisha Sathi",
    title: "Odisha Sathi – Odisha Jobs, Exams, Results, Admissions & Schemes",
    description:
      "Odisha Sathi provides latest Odisha jobs, exams, results, admissions, scholarships, government schemes, useful tools and online services.",
    images: [
      {
        url: "/api/og/post?category=Update&department=Odisha%20Sathi&posts=Jobs%2C%20Admissions%2C%20Results%2C%20Schemes",
        width: 1200,
        height: 630,
        alt: "Odisha Sathi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Odisha Sathi – Odisha Jobs, Exams, Results, Admissions & Schemes",
    description:
      "Latest Odisha jobs, exams, results, admissions, scholarships, government schemes and useful tools.",
    images: [
      "/api/og/post?category=Update&department=Odisha%20Sathi&posts=Jobs%2C%20Admissions%2C%20Results%2C%20Schemes",
    ],
  },
  icons: {
    icon: "/odisha-sathi-logo.png",
    apple: "/odisha-sathi-logo.png",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <StructuredData />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}