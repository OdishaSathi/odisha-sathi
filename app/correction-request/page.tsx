import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Correction / Update Request",
  description:
    "Request correction or update for any Odisha Sathi post with official source details.",
};

export default function CorrectionRequestPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Correction / Update Request</h1>
          <p>
            Help us keep Odisha Sathi posts accurate and useful for everyone.
          </p>
        </div>
      </section>

      <section className="section container">
        <article className="article trust-article">
          <h2>When to Request a Correction</h2>
          <p>
            Use this page if you find an incorrect date, wrong link, outdated
            post, spelling mistake, missing official source, or any important
            update that should be corrected on Odisha Sathi.
          </p>

          <h2>What to Send</h2>
          <ul>
            <li>Post title or page URL</li>
            <li>What information is wrong or outdated</li>
            <li>Correct information</li>
            <li>Official source link, PDF or notification reference</li>
            <li>Your contact detail only if a reply is needed</li>
          </ul>

          <div className="trust-info-grid">
            <div className="trust-info-card">
              <h3>Best Source</h3>
              <p>
                Official notification, official PDF, official website notice or
                verified department/exam board update.
              </p>
            </div>
            <div className="trust-info-card">
              <h3>Do Not Send</h3>
              <p>
                Do not send passwords, OTPs, bank details, Aadhaar copies or
                unnecessary personal documents.
              </p>
            </div>
          </div>

          <h2>Where to Send</h2>
          {siteConfig.contact.email ? (
            <p>
              Email: <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>
            </p>
          ) : (
            <p>
              A dedicated correction email can be added from Admin Settings
              later. Until then, use the available Odisha Sathi contact/social
              links from the <Link href="/contact">Contact Us</Link> page.
            </p>
          )}

          <p>
            You may also follow the Odisha Sathi WhatsApp channel for updates:
            {" "}
            <a href={siteConfig.contact.whatsappChannel} target="_blank" rel="noreferrer">
              Open WhatsApp Channel
            </a>
          </p>
        </article>
      </section>
    </>
  );
}
