import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Odisha Sathi | Jobs, Exams, Results & Govt. Schemes",
  description: "Daily updates on Odisha government jobs, exams, results, scholarships, admissions and government schemes.",
  metadataBase: new URL("https://odishasathi.in")
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
