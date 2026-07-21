import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Odisha Sathi, an informational platform sharing Odisha jobs, admissions, admit cards, exams, results, schemes and useful online updates.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>About Odisha Sathi</h1>
          <p>
            A public information platform for jobs, admissions, admit cards,
            exams, results, schemes and useful online updates.
          </p>
        </div>
      </section>

      <section className="section container">
        <article className="article trust-article">
          <h2>Who We Are</h2>
          <p>
            Odisha Sathi shares useful updates for students, job seekers and
            citizens in a simple and easy-to-understand format. Our aim is to
            help users quickly find important public information and visit the
            correct official source when required.
          </p>

          <h2>What We Cover</h2>
          <ul>
            <li>Latest jobs and recruitment updates</li>
            <li>Admissions and exam-related notices</li>
            <li>Admit cards, exam dates, syllabus and exam pattern updates</li>
            <li>Results, merit lists and selection list updates</li>
            <li>Government schemes and scholarship information</li>
            <li>Useful online tools and service information</li>
          </ul>

          <h2>Important Notice</h2>
          <p>
            {siteConfig.siteName} is not a government website and is not
            affiliated with any government department, recruitment board,
            university or examination authority. Users should always verify
            details from the official notification, official website or official
            PDF before applying, paying fees or taking any action.
          </p>

          <div className="trust-action-row">
            <Link className="btn" href="/contact">
              Contact Us
            </Link>
            <Link className="btn outline" href="/disclaimer">
              Read Disclaimer
            </Link>
          </div>
        </article>
      </section>
    </>
  );
}
