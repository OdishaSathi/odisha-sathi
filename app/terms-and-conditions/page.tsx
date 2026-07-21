import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms and Conditions for using Odisha Sathi website and public information updates.",
  alternates: { canonical: "/terms-and-conditions" },
};

export default function TermsAndConditionsPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Terms & Conditions</h1>
          <p>
            These terms explain the basic rules for using Odisha Sathi.
          </p>
        </div>
      </section>

      <section className="section container">
        <article className="article trust-article">
          <h2>Acceptance of Terms</h2>
          <p>
            By using Odisha Sathi, you agree to use the website responsibly and
            understand that the information is provided for general public
            awareness and quick reference.
          </p>

          <h2>User Responsibility</h2>
          <p>
            Users are responsible for verifying all important information from
            official sources before applying, paying fees, downloading documents
            or taking any action.
          </p>

          <h2>Content Use</h2>
          <p>
            Content on Odisha Sathi is provided for informational purposes. You
            may share website links for awareness, but you should not misuse,
            copy, modify or present the content in a misleading way.
          </p>

          <h2>External Websites</h2>
          <p>
            Odisha Sathi may link to external official and third-party websites.
            We are not responsible for external website content, downtime,
            security, payment systems or user experience.
          </p>

          <h2>Prohibited Use</h2>
          <ul>
            <li>Do not use this website for illegal or misleading activities.</li>
            <li>Do not attempt to hack, spam or overload the website.</li>
            <li>Do not impersonate Odisha Sathi or claim false official affiliation.</li>
            <li>Do not share false correction requests or harmful links.</li>
          </ul>

          <h2>Changes to Terms</h2>
          <p>
            We may update these Terms & Conditions when needed. Continued use of
            the website after updates means you accept the revised terms.
          </p>

          <h2>Contact</h2>
          <p>
            For questions, visit the <Link href="/contact">Contact Us</Link> page.
          </p>
        </article>
      </section>
    </>
  );
}
