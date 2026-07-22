import type { Metadata } from "next";
import Link from "next/link";
import { PublicContactEmail } from "@/components/PublicContactDetails";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Odisha Sathi covering cookies, Google Analytics, advertising, user data, external links and contact information.",
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
            cookies, analytics, advertising, external links and user privacy.
          </p>
        </div>
      </section>

      <section className="section container">
        <article className="article trust-article">
          <p className="article-meta">Last updated: 22 July 2026</p>

          <h2>Introduction</h2>
          <p>
            Odisha Sathi provides public information related to jobs,
            admissions, admit cards, exams, results, schemes and useful online
            services. We respect user privacy and aim to collect only the
            information needed to operate, secure and improve the website.
          </p>

          <h2>Information We May Collect</h2>
          <ul>
            <li>
              Basic technical information such as browser type, device type,
              referring page, approximate location and pages visited.
            </li>
            <li>
              Cookie identifiers and similar technical information used for
              analytics, security and advertising where applicable.
            </li>
            <li>
              Information voluntarily shared through contact, feedback or
              correction requests.
            </li>
          </ul>

          <h2>How We Use Information</h2>
          <p>
            Information is used to operate and secure Odisha Sathi, understand
            which pages are useful, improve website performance, correct content
            and respond to messages. We do not ask visitors for passwords, OTPs,
            banking credentials or other confidential account information.
          </p>

          <h2>Google Analytics</h2>
          <p>
            Odisha Sathi uses Google Analytics 4 to understand visits, page
            usage, devices and website performance. Google Analytics may use
            cookies or similar identifiers and may process technical information
            such as an IP address and browser information. We use aggregated
            reports to improve the website and do not use Analytics reports to
            personally identify individual visitors.
          </p>
          <p>
            Learn more about{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noreferrer"
            >
              how Google uses information from sites that use its services
            </a>
            .
          </p>

          <h2>Cookies and Advertising</h2>
          <p>
            Odisha Sathi and third-party services may place or read cookies,
            use web beacons, or process IP addresses to measure site usage,
            prevent fraud, improve services and serve advertising where enabled.
            Third-party vendors, including Google, may use cookies to serve ads
            based on a visitor&apos;s prior visits to this website or other websites.
            Google&apos;s advertising cookies enable Google and its partners to show
            ads based on visits to this website and/or other websites on the
            Internet.
          </p>
          <p>
            Visitors can manage personalized advertising through{" "}
            <a
              href="https://adssettings.google.com/"
              target="_blank"
              rel="noreferrer"
            >
              Google Ads Settings
            </a>
            , and can control or delete cookies through their browser settings.
            Blocking cookies may affect some website or embedded-content
            features.
          </p>

          <h2>Third-Party Services and External Links</h2>
          <p>
            Odisha Sathi may use or link to services such as Google Analytics,
            Firebase, YouTube, Google advertising services, official government
            websites, PDF notifications and application portals. These services
            have their own privacy policies and may process data according to
            their terms. Odisha Sathi is not responsible for the content,
            accuracy, security or privacy practices of an external website.
          </p>

          <h2>Personal Information and Data Safety</h2>
          <p>
            Do not submit sensitive personal documents through this website
            unless a proper official service or verified communication channel is
            provided. We take reasonable steps to keep website data safe, but no
            online platform can guarantee complete security. Always verify the
            official source before submitting information on a third-party portal.
          </p>

          <h2>Children&apos;s Privacy</h2>
          <p>
            Odisha Sathi is an informational website. Children or students should
            use the website with guidance from parents, guardians or teachers
            when needed, especially before opening external application portals
            or sharing personal information.
          </p>

          <h2>Your Choices</h2>
          <p>
            Visitors may control cookies through browser settings, manage Google
            ad personalization through Google Ads Settings, and contact Odisha
            Sathi regarding voluntarily submitted information or privacy concerns.
          </p>

          <h2>Policy Updates</h2>
          <p>
            This Privacy Policy may be updated from time to time. Material
            updates will be posted on this page with a revised date.
          </p>

          <h2>Contact</h2>
          <p>
            For privacy-related questions, email <PublicContactEmail /> or visit
            the <Link href="/contact"> Contact Us</Link> page.
          </p>
        </article>
      </section>
    </>
  );
}
