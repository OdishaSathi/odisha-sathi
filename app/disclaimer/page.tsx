import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Disclaimer",
  description:
    "Disclaimer for Odisha Sathi explaining that the website is not a government website and users should verify official sources.",
};

export default function DisclaimerPage() {
  return (
    <>
      <section className="page-head">
        <div className="container">
          <h1>Disclaimer</h1>
          <p>
            Please read this disclaimer before using Odisha Sathi information.
          </p>
        </div>
      </section>

      <section className="section container">
        <article className="article trust-article">
          <h2>Not a Government Website</h2>
          <p>
            {siteConfig.siteName} is not a government website and is not
            affiliated with any government department, recruitment board,
            education board, university, examination authority or official
            scheme authority.
          </p>

          <h2>Information Purpose Only</h2>
          <p>
            The information published on Odisha Sathi is for general public
            awareness and quick reference. We try to keep information clear and
            updated, but we do not guarantee that every detail is complete,
            error-free or always up to date.
          </p>

          <h2>Verify Official Source</h2>
          <p>
            Users must verify all important details such as eligibility, dates,
            fees, vacancies, syllabus, application process, results and official
            links from the official notification, official PDF or official
            website before applying or taking action.
          </p>

          <h2>No Liability</h2>
          <p>
            Odisha Sathi is not responsible for any loss, mistake, missed date,
            incorrect application, fee payment issue, external website issue or
            decision made based on information from this website.
          </p>

          <h2>External Links</h2>
          <p>
            This website may include links to official or third-party websites.
            We do not control external websites and are not responsible for their
            content, availability, security or privacy practices.
          </p>

          <h2>Report Correction</h2>
          <p>
            If you find any incorrect or outdated information, please use the
            <Link href="/correction-request"> Correction / Update Request </Link>
            page and share the correct official source.
          </p>
        </article>
      </section>
    </>
  );
}
