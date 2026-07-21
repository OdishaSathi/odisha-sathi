import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Odisha Sathi covering cookies, advertising, analytics, user data, external links and contact information.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Privacy Policy</h1>
          <p>
            This Privacy Policy explains how Odisha Sathi handles information,
            cookies, advertising, external links and user privacy.
          </p>
        </div>
      </section>

      <section className="section container">
        <article className="article trust-article">
          <p className="article-meta">Last updated: 10 July 2026</p>

          <h2>Introduction</h2>
          <p>
            Odisha Sathi provides public information related to jobs,
            admissions, admit cards, exams, results, schemes and useful online
            services. We respect user privacy and aim to collect only the
            information needed to operate and improve the website.
          </p>

          <h2>Information We May Collect</h2>
          <ul>
            <li>Basic technical information such as browser, device and page usage.</li>
            <li>Information voluntarily shared through contact or correction requests.</li>
            <li>Non-personal analytics information used to understand website performance.</li>
          </ul>

          <h2>Cookies and Advertising</h2>
          <p>
            Third-party vendors, including Google, may use cookies to serve ads
            based on a user's prior visits to this website or other websites.
            Google's use of advertising cookies enables Google and its partners
            to serve ads based on visits to this site and/or other sites on the
            Internet.
          </p>
          <p>
            Users may visit Google Ads Settings to manage personalized ads. If
            Google AdSense or similar advertising services are enabled in the
            future, this policy may be updated to include any additional required
            details.
          </p>

          <h2>External Links</h2>
          <p>
            Odisha Sathi may link to official websites, PDF notifications,
            application portals and other third-party websites. We are not
            responsible for the privacy practices, content, accuracy or security
            of external websites. Users should read the privacy policy of the
            external website before sharing information there.
          </p>

          <h2>Personal Information</h2>
          <p>
            Do not submit sensitive personal documents through this website
            unless a proper official service or verified communication channel is
            provided. Odisha Sathi does not ask users to share passwords, OTPs,
            banking details or confidential credentials.
          </p>

          <h2>Data Safety</h2>
          <p>
            We take reasonable steps to keep website data safe. However, no
            online platform can guarantee complete security. Users should verify
            official sources before submitting information on third-party portals.
          </p>

          <h2>Children's Privacy</h2>
          <p>
            Odisha Sathi is an informational website. Children or students should
            use the website with guidance from parents, guardians or teachers
            when needed.
          </p>

          <h2>Policy Updates</h2>
          <p>
            This Privacy Policy may be updated from time to time. Updates will
            be posted on this page with the revised date.
          </p>

          <h2>Contact</h2>
          <p>
            For privacy-related questions, please visit the <Link href="/contact">Contact Us</Link> page.
          </p>
        </article>
      </section>
    </>
  );
}
