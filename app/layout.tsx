import type { Metadata } from "next";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import StructuredData from "@/components/StructuredData";
import GoogleAnalytics from "@/components/GoogleAnalytics";

export const metadata: Metadata = {
  metadataBase: new URL("https://odishasathi.in"),
  title: {
    default: "Odisha Sathi – Odisha Jobs, Exams, Results, Admissions & Citizen Services",
    template: "%s | Odisha Sathi",
  },
  description:
    "Odisha Sathi provides latest Odisha jobs, exams, results, admissions, important information and citizen services.",
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
    "Odisha citizen services",
    "Odisha Sathi",
    "online works",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://odishasathi.in",
    siteName: "Odisha Sathi",
    title: "Odisha Sathi – Odisha Jobs, Exams, Results, Admissions & Citizen Services",
    description:
      "Odisha Sathi provides latest Odisha jobs, exams, results, admissions, important information and citizen services.",
    images: [
      {
        url: "/api/og/post?category=Update&department=Odisha%20Sathi&posts=Jobs%2C%20Admissions%2C%20Results%2C%20Citizen%20Services",
        width: 1200,
        height: 630,
        alt: "Odisha Sathi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Odisha Sathi – Odisha Jobs, Exams, Results, Admissions & Citizen Services",
    description:
      "Latest Odisha jobs, exams, results, admissions, important information and citizen services.",
    images: [
      "/api/og/post?category=Update&department=Odisha%20Sathi&posts=Jobs%2C%20Admissions%2C%20Results%2C%20Citizen%20Services",
    ],
  },
  icons: {
    icon: "/odisha-sathi-logo.png",
    apple: "/odisha-sathi-logo.png",
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      }
    : undefined,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
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
        <GoogleAnalytics />
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
