"use client";

type AdminPostShareButtonsProps = {
  title: string;
  publicPath: string;
  description?: string;
};

type SharePlatform = "whatsapp" | "telegram" | "facebook";

function getSiteOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function buildShareText(title: string, publicPath: string, description?: string) {
  const origin = getSiteOrigin();
  const cleanPath = publicPath.startsWith("/") ? publicPath : `/${publicPath}`;
  const url = `${origin}${cleanPath}`;
  return [title, description, url].filter(Boolean).join("\n");
}

function openShare(platform: SharePlatform, text: string, publicPath: string) {
  const origin = getSiteOrigin();
  const cleanPath = publicPath.startsWith("/") ? publicPath : `/${publicPath}`;
  const url = `${origin}${cleanPath}`;

  const shareUrl =
    platform === "whatsapp"
      ? `https://wa.me/?text=${encodeURIComponent(text)}`
      : platform === "telegram"
      ? `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
      : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;

  window.open(shareUrl, "_blank", "noopener,noreferrer");
}

const SHARE_ITEMS = [
  {
    key: "whatsapp" as const,
    label: "WhatsApp",
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16.01 3.2c-7.05 0-12.78 5.73-12.78 12.78 0 2.25.59 4.45 1.71 6.39L3.13 29l6.8-1.78a12.7 12.7 0 0 0 6.08 1.55c7.05 0 12.78-5.73 12.78-12.78S23.06 3.2 16.01 3.2Zm0 23.4c-1.93 0-3.82-.52-5.47-1.5l-.39-.23-4.03 1.06 1.08-3.93-.25-.4a10.56 10.56 0 0 1-1.55-5.62c0-5.85 4.76-10.61 10.61-10.61s10.61 4.76 10.61 10.61-4.76 10.62-10.61 10.62Zm5.82-7.95c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.72.16-.21.32-.82 1.03-1.01 1.24-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.58-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.5.14-.66.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.98-2.38-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.47 4.84.76.33 1.36.53 1.82.68.77.24 1.47.21 2.02.13.62-.09 1.88-.77 2.15-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    ),
  },
  {
    key: "telegram" as const,
    label: "Telegram",
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M27.8 5.1 4.9 13.92c-1.56.62-1.55 1.48-.28 1.87l5.88 1.84 2.25 6.9c.29.8.15 1.12.98 1.12.64 0 .92-.3 1.28-.64l3.08-3 6.4 4.73c1.17.65 2.02.31 2.32-1.08L31 6.48c.42-1.68-.64-2.44-3.2-1.38Zm-3.72 5.05L13.26 19.9l-.42 4.44-1.72-5.62 12.96-8.57Z" />
      </svg>
    ),
  },
  {
    key: "facebook" as const,
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M19.1 17.9h3.28l.52-4.02h-3.8v-2.2c0-1.06.34-1.78 1.9-1.78h2.02V6.3c-.35-.05-1.55-.15-2.95-.15-2.92 0-4.92 1.78-4.92 5.05v2.68h-3.3v4.02h3.3v10h3.95v-10Z" />
      </svg>
    ),
  },
];

export default function AdminPostShareButtons({
  title,
  publicPath,
  description,
}: AdminPostShareButtonsProps) {
  const handleShare = (platform: SharePlatform) => {
    const shareText = buildShareText(title || "Odisha Sathi Update", publicPath, description);
    openShare(platform, shareText, publicPath);
  };

  return (
    <div className="admin-post-share-actions" aria-label="Share saved post">
      {SHARE_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`admin-post-share-btn admin-post-share-${item.key}`}
          onClick={() => handleShare(item.key)}
          title={`Share on ${item.label}`}
          aria-label={`Share on ${item.label}`}
        >
          {item.icon}
          <span className="sr-only">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
