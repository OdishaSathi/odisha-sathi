import SocialLinks from "@/components/SocialLinks";

export default function SocialFollowPromo({ compact = false }: { compact?: boolean }) {
  return (
    <section
      className={compact ? "social-follow-promo social-follow-promo-compact" : "social-follow-promo"}
      aria-label="Follow Odisha Sathi on social media"
    >
      <div className="social-follow-text">
        <span className="social-follow-badge">Follow Odisha Sathi</span>
        <h2>Get fast updates on WhatsApp, Telegram, YouTube, Facebook & Instagram</h2>
        <p>
          Follow our official social pages for latest jobs, admissions, admit cards,
          exams, results, schemes and important public updates.
        </p>
      </div>
      <SocialLinks className="social-follow-links" />
    </section>
  );
}
