"use client";

import { useEffect, useMemo, useState } from "react";

type SocialShareButtonsProps = {
  title: string;
  description?: string;
  postUrl?: string;
};

function ShareIcon({
  type,
}: {
  type: "whatsapp" | "telegram" | "facebook" | "copy";
}) {
  if (type === "whatsapp") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16.01 3.2c-7.05 0-12.78 5.73-12.78 12.78 0 2.25.59 4.45 1.71 6.39L3.13 29l6.8-1.78a12.7 12.7 0 0 0 6.08 1.55c7.05 0 12.78-5.73 12.78-12.78S23.06 3.2 16.01 3.2Zm0 23.4c-1.93 0-3.82-.52-5.47-1.5l-.39-.23-4.03 1.06 1.08-3.93-.25-.4a10.56 10.56 0 0 1-1.55-5.62c0-5.85 4.76-10.61 10.61-10.61s10.61 4.76 10.61 10.61-4.76 10.62-10.61 10.62Zm5.82-7.95c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.72.16-.21.32-.82 1.03-1.01 1.24-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.58-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.5.14-.66.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.98-2.38-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.47 4.84.76.33 1.36.53 1.82.68.77.24 1.47.21 2.02.13.62-.09 1.88-.77 2.15-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    );
  }

  if (type === "telegram") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M27.8 5.1 4.9 13.92c-1.56.62-1.55 1.48-.28 1.87l5.88 1.84 2.25 6.9c.29.8.15 1.12.98 1.12.64 0 .92-.3 1.28-.64l3.08-3 6.4 4.73c1.17.65 2.02.31 2.32-1.08L31 6.48c.42-1.68-.64-2.44-3.2-1.38Zm-3.72 5.05L13.26 19.9l-.42 4.44-1.72-5.62 12.96-8.57Z" />
      </svg>
    );
  }

  if (type === "facebook") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M19.1 17.9h3.28l.52-4.02h-3.8v-2.2c0-1.06.34-1.78 1.9-1.78h2.02V6.3c-.35-.05-1.55-.15-2.95-.15-2.92 0-4.92 1.78-4.92 5.05v2.68h-3.3v4.02h3.3v10h3.95v-10Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 7a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-1v-2h1a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1H8V7Zm-2 2h7a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Zm0 2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1H6Z" />
    </svg>
  );
}

export default function SocialShareButtons({
  title,
  description,
  postUrl,
}: SocialShareButtonsProps) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!postUrl && typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, [postUrl]);

  const shareUrl = postUrl || currentUrl;
  const shareText = useMemo(
    () => [title, description].filter(Boolean).join("\n"),
    [title, description]
  );
  const whatsappUrl = useMemo(
    () =>
      shareUrl
        ? `https://wa.me/?text=${encodeURIComponent(
            `${shareText}\n${shareUrl}`
          )}`
        : "#",
    [shareText, shareUrl]
  );
  const telegramUrl = useMemo(
    () =>
      shareUrl
        ? `https://t.me/share/url?url=${encodeURIComponent(
            shareUrl
          )}&text=${encodeURIComponent(shareText)}`
        : "#",
    [shareText, shareUrl]
  );
  const facebookUrl = useMemo(
    () =>
      shareUrl
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareUrl
          )}&quote=${encodeURIComponent(shareText)}`
        : "#",
    [shareText, shareUrl]
  );

  async function copyLink() {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const input = document.createElement("textarea");
      input.value = shareUrl;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <>
      <div className="compact-social-share" aria-label="Share this page">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="compact-share-button whatsapp"
          title="Share on WhatsApp"
          aria-label="Share on WhatsApp"
        >
          <ShareIcon type="whatsapp" />
        </a>
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="compact-share-button telegram"
          title="Share on Telegram"
          aria-label="Share on Telegram"
        >
          <ShareIcon type="telegram" />
        </a>
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="compact-share-button facebook"
          title="Share on Facebook"
          aria-label="Share on Facebook"
        >
          <ShareIcon type="facebook" />
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="compact-share-button copy"
          title={copied ? "Link copied" : "Copy link"}
          aria-label={copied ? "Link copied" : "Copy link"}
          disabled={!shareUrl}
        >
          <ShareIcon type="copy" />
        </button>
        {copied ? (
          <span className="compact-copy-status" aria-live="polite">
            Copied
          </span>
        ) : null}
      </div>

      <style jsx>{`
        .compact-social-share {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-wrap: wrap;
          gap: 8px;
          width: 100%;
          min-width: 0;
          margin-top: 10px;
          padding-bottom: 2px;
          overflow: visible;
        }

        .compact-share-button {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          min-width: 38px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 0;
          border-radius: 999px;
          color: #ffffff;
          cursor: pointer;
          text-decoration: none;
          box-shadow: 0 5px 13px rgba(15, 23, 42, 0.15);
          transition: transform 0.16s ease, box-shadow 0.16s ease;
        }

        .compact-share-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 16px rgba(15, 23, 42, 0.2);
        }

        .compact-share-button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .compact-share-button :global(svg) {
          width: 19px;
          height: 19px;
          display: block;
          fill: currentColor;
        }

        .whatsapp {
          background: #16a34a;
        }

        .telegram {
          background: #0284c7;
        }

        .facebook {
          background: #1877f2;
        }

        .copy {
          background: #334155;
        }

        .compact-copy-status {
          color: #166534;
          font-size: 12px;
          font-weight: 850;
        }

        @media (max-width: 520px) {
          .compact-social-share {
            gap: 7px;
            margin-top: 8px;
          }

          .compact-share-button {
            width: 36px;
            height: 36px;
            flex-basis: 36px;
            min-width: 36px;
          }
        }
      `}</style>
    </>
  );
}
