import type { Metadata } from "next";
import Link from "next/link";
import PublicContactDetails from "@/components/PublicContactDetails";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Odisha Sathi for correction requests, update requests, feedback and website-related communication.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Contact Us</h1>
          <p>
            Send feedback, report wrong information or request an update related
            to Odisha Sathi content.
          </p>
        </div>
      </section>

      <section className="section container">
        <article className="article trust-article">
          <h2>Contact Purpose</h2>
          <p>
            You can contact Odisha Sathi for correction requests, update
            requests, content feedback, technical issues, privacy questions and
            general website communication.
          </p>

          <div className="trust-info-grid">
            <div className="trust-info-card">
              <h3>Correction / Update</h3>
              <p>
                If any date, link, title or post information looks wrong, please
                send the page link and the correct official source.
              </p>
              <Link href="/correction-request">Open correction request</Link>
            </div>

            <div className="trust-info-card">
              <h3>Social Updates</h3>
              <p>
                Follow the Odisha Sathi WhatsApp channel for important public
                updates and announcements.
              </p>
              <a
                href={siteConfig.contact.whatsappChannel}
                target="_blank"
                rel="noreferrer"
              >
                Open WhatsApp Channel
              </a>
            </div>
          </div>

          <h2>Contact Details</h2>
          <PublicContactDetails />

          <h2>Before Contacting</h2>
          <ul>
            <li>Share the exact page URL or post title.</li>
            <li>Explain what needs to be corrected or updated.</li>
            <li>Attach or mention the official source if available.</li>
            <li>Do not share passwords, OTPs, banking details or unnecessary personal documents.</li>
          </ul>
        </article>
      </section>
    </>
  );
}
