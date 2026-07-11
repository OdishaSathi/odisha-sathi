import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";
import { siteConfig } from "@/lib/siteConfig";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer" aria-label="Website footer">
      <div className="container footer-grid footer-grid-four">
        <div className="footer-brand-block">
          <h3>{siteConfig.siteName}</h3>
          <p>{siteConfig.description}</p>
          <p className="footer-disclaimer-note">
            Odisha Sathi is not a government website. Always verify important
            details from the official notification or official website before
            applying.
          </p>
        </div>

        <div>
          <h4>Main Sections</h4>
          <nav className="footer-links" aria-label="Footer main sections">
            {siteConfig.footerMainLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h4>Important Links</h4>
          <nav className="footer-links" aria-label="Footer important links">
            {siteConfig.footerTrustLinks.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <h4>Connect With Us</h4>
          <SocialLinks iconOnly />
          {siteConfig.contact.address ? (
            <p className="footer-small-text">Location: {siteConfig.contact.address}</p>
          ) : null}
          <Link className="footer-contact-link" href="/contact">
            Contact / Correction Request
          </Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {currentYear} {siteConfig.siteName}. All rights reserved. Not a
          government website. Trademarks, logos and official names belong to
          their respective owners.
        </p>
      </div>
    </footer>
  );
}
