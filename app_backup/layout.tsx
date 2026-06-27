import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://odishasathi.in"),
  title: {
    default: "Odisha Sathi – Odisha Jobs, Exams, Results, Admissions & Schemes",
    template: "%s | Odisha Sathi"
  },
  description:
    "Odisha Sathi provides latest Odisha jobs, exams, results, admissions, scholarships, government schemes, useful tools and online services.",
  keywords: [
    "Odisha jobs",
    "Odisha exams",
    "Odisha results",
    "Odisha admissions",
    "Odisha scholarships",
    "Odisha govt schemes",
    "Odisha Sathi",
    "online works"
  ],
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}