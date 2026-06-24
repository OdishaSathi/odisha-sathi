import { siteConfig } from "@/lib/siteConfig";

const socialItems = [
  { key: "whatsapp", label: "WhatsApp", href: siteConfig.socialLinks.whatsapp, short: "W" },
  { key: "youtube", label: "YouTube", href: siteConfig.socialLinks.youtube, short: "Y" },
  { key: "facebook", label: "Facebook", href: siteConfig.socialLinks.facebook, short: "F" },
  { key: "instagram", label: "Instagram", href: siteConfig.socialLinks.instagram, short: "I" }
];

export default function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`social-link-row ${className}`.trim()}>
      {socialItems.map((item) => (
        <a
          key={item.key}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className={`social-link social-${item.key}`}
          aria-label={item.label}
        >
          <span className="social-icon">{item.short}</span>
          <span>{item.label}</span>
        </a>
      ))}
    </div>
  );
}