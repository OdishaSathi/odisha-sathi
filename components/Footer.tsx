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
            One stop solution for jobs, exams, results, admissions, scholarships,
            government schemes and online works.
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
          <h4>Important Note</h4>
          <p>
            Odisha Sathi shares information for awareness. Visitors should always
            verify details from official websites before applying.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Odisha Sathi. All rights reserved.</p>
      </div>
    </footer>
  );
}