"use client";

import { useEffect, useMemo, useState } from "react";

type SocialShareButtonsProps = {
  title: string;
  description?: string;
  postUrl?: string;
};

export default function SocialShareButtons({
  title,
  description,
  postUrl,
}: SocialShareButtonsProps) {
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (!postUrl && typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, [postUrl]);

  const shareUrl = postUrl || currentUrl;

  const shareText = useMemo(() => {
    return [title, description].filter(Boolean).join("\n");
  }, [title, description]);

  const whatsappUrl = useMemo(() => {
    if (!shareUrl) return "#";

    return `https://wa.me/?text=${encodeURIComponent(
      `${shareText}\n${shareUrl}`
    )}`;
  }, [shareText, shareUrl]);

  const telegramUrl = useMemo(() => {
    if (!shareUrl) return "#";

    return `https://t.me/share/url?url=${encodeURIComponent(
      shareUrl
    )}&text=${encodeURIComponent(shareText)}`;
  }, [shareText, shareUrl]);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        gap: "10px",
        marginTop: "22px",
      }}
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "42px",
          padding: "10px 16px",
          borderRadius: "999px",
          background: "#16a34a",
          color: "#ffffff",
          fontWeight: 700,
          textDecoration: "none",
          fontSize: "14px",
          boxShadow: "0 8px 20px rgba(22, 163, 74, 0.22)",
        }}
      >
        Share on WhatsApp
      </a>

      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "42px",
          padding: "10px 16px",
          borderRadius: "999px",
          background: "#0284c7",
          color: "#ffffff",
          fontWeight: 700,
          textDecoration: "none",
          fontSize: "14px",
          boxShadow: "0 8px 20px rgba(2, 132, 199, 0.22)",
        }}
      >
        Share on Telegram
      </a>
    </div>
  );
}