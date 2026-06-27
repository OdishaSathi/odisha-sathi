import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";
import { siteConfig } from "@/lib/siteConfig";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h3>Odisha Sathi</h3>
          <p>
            Latest updates for jobs, results, admissions, admit cards,
            government schemes and useful online services.
          </p>
          <SocialLinks />
        </div>

        <div>
          <h4>Quick Links</h4>
          <div className="footer-links">
            {siteConfig.headerNav.map((item) => (
              <Link key={item.label} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4>Disclaimer</h4>
          <p>
            Odisha Sathi shares information for public awareness. Visitors
            should always verify details from official websites or official PDF
            notifications before applying or taking any action.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Odisha Sathi. All rights reserved.</p>
      </div>
    </footer>
  );
}