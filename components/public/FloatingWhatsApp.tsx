import { siteConfig } from "@/lib/siteConfig";

export default function FloatingWhatsApp() {
  const whatsappLink = siteConfig.socialLinks.whatsapp;

  if (!whatsappLink || whatsappLink === "#") {
    return null;
  }

  return (
    <a
      href={whatsappLink}
      className="floating-whatsapp"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Follow Odisha Sathi WhatsApp Channel"
      title="Follow Odisha Sathi on WhatsApp"
    >
      <span className="floating-whatsapp-pulse" />

      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16.02 3.2C8.95 3.2 3.2 8.86 3.2 15.82c0 2.23.6 4.4 1.73 6.31L3.1 28.8l6.87-1.78a12.9 12.9 0 0 0 6.05 1.5c7.07 0 12.82-5.66 12.82-12.62S23.09 3.2 16.02 3.2Zm0 23.17c-1.9 0-3.75-.5-5.37-1.45l-.38-.22-4.08 1.06 1.08-3.9-.25-.4a10.16 10.16 0 0 1-1.58-5.44c0-5.75 4.75-10.42 10.58-10.42S26.6 10.27 26.6 16.02s-4.75 10.35-10.58 10.35Zm5.8-7.75c-.32-.16-1.9-.93-2.2-1.04-.29-.1-.5-.16-.72.16-.21.32-.82 1.04-1 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.49-2.58-1.55-.95-.84-1.6-1.88-1.78-2.2-.19-.32-.02-.5.14-.66.15-.15.32-.37.48-.56.16-.19.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.72-1.72-.98-2.36-.26-.62-.52-.53-.72-.54h-.62c-.21 0-.56.08-.85.4-.29.32-1.12 1.08-1.12 2.63s1.15 3.05 1.31 3.26c.16.21 2.26 3.4 5.47 4.77.76.32 1.35.51 1.81.65.76.24 1.45.21 2 .13.61-.09 1.9-.77 2.17-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </a>
  );
}