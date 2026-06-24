import Link from "next/link";
import CategoryPills from "@/components/CategoryPills";
import LatestPosts from "@/components/LatestPosts";
import SocialLinks from "@/components/SocialLinks";
import { siteConfig } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-eyebrow">Odisha Jobs • Exams • Results • Admissions</span>
            <h1>Odisha Sathi</h1>
            <p className="hero-tagline">{siteConfig.tagline}</p>
            <p className="hero-description">
              Get latest updates on Odisha government jobs, central jobs, exams,
              results, admissions, scholarships, government schemes and useful online services.
            </p>

            <div className="hero-actions">
              <Link href="#latest" className="btn">
                Latest Updates
              </Link>
              <Link href="/tools" className="btn secondary">
                Online Tools
              </Link>
            </div>
          </div>

          <aside className="promo-card">
            <p className="promo-label">Stay Connected</p>
            <h2>Follow Odisha Sathi</h2>
            <p>
              Follow our social media pages for daily updates on jobs, exams,
              results, admissions, scholarships and government schemes.
            </p>

            <SocialLinks />
          </aside>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading-row">
          <div>
            <h2>Browse Main Categories</h2>
            <p>Select a category to find related updates quickly.</p>
          </div>
        </div>

        <CategoryPills />
      </section>

      <section className="section container" id="latest">
        <div className="section-heading-row">
          <div>
            <h2>Latest Updates</h2>
            <p>Fresh posts from Odisha Sathi.</p>
          </div>

          <Link href="/category/jobs" className="btn secondary">
            View Jobs
          </Link>
        </div>

        <LatestPosts />
      </section>
    </>
  );
}