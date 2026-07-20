"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { siteConfig } from "@/lib/siteConfig";
import { db } from "@/lib/firebase";

function isUsableSocialLink(href?: string) {
  if (!href) return false;
  const value = href.trim();
  return Boolean(value && value !== "#" && value !== "https://" && value !== "http://");
}

const socialItems = [
  {
    key: "whatsapp",
    label: "WhatsApp Channel",
    href: siteConfig.socialLinks.whatsapp,
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16.01 3.2c-7.05 0-12.78 5.73-12.78 12.78 0 2.25.59 4.45 1.71 6.39L3.13 29l6.8-1.78a12.7 12.7 0 0 0 6.08 1.55c7.05 0 12.78-5.73 12.78-12.78S23.06 3.2 16.01 3.2Zm0 23.4c-1.93 0-3.82-.52-5.47-1.5l-.39-.23-4.03 1.06 1.08-3.93-.25-.4a10.56 10.56 0 0 1-1.55-5.62c0-5.85 4.76-10.61 10.61-10.61s10.61 4.76 10.61 10.61-4.76 10.62-10.61 10.62Zm5.82-7.95c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.72.16-.21.32-.82 1.03-1.01 1.24-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.58-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.5.14-.66.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.74-.98-2.38-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.47 4.84.76.33 1.36.53 1.82.68.77.24 1.47.21 2.02.13.62-.09 1.88-.77 2.15-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    ),
  },
  {
    key: "telegram",
    label: "Telegram",
    href: siteConfig.socialLinks.telegram,
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M27.8 5.1 4.9 13.92c-1.56.62-1.55 1.48-.28 1.87l5.88 1.84 2.25 6.9c.29.8.15 1.12.98 1.12.64 0 .92-.3 1.28-.64l3.08-3 6.4 4.73c1.17.65 2.02.31 2.32-1.08L31 6.48c.42-1.68-.64-2.44-3.2-1.38Zm-3.72 5.05L13.26 19.9l-.42 4.44-1.72-5.62 12.96-8.57Z" />
      </svg>
    ),
  },
  {
    key: "youtube",
    label: "YouTube",
    href: siteConfig.socialLinks.youtube,
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M29.3 9.9a3.42 3.42 0 0 0-2.4-2.42C24.78 6.9 16.3 6.9 16.3 6.9s-8.48 0-10.6.58A3.42 3.42 0 0 0 3.3 9.9c-.57 2.13-.57 6.58-.57 6.58s0 4.45.57 6.58a3.42 3.42 0 0 0 2.4 2.42c2.12.58 10.6.58 10.6.58s8.48 0 10.6-.58a3.42 3.42 0 0 0 2.4-2.42c.57-2.13.57-6.58.57-6.58s0-4.45-.57-6.58ZM13.58 20.6v-8.24l7.04 4.12-7.04 4.12Z" />
      </svg>
    ),
  },
  {
    key: "facebook",
    label: "Facebook",
    href: siteConfig.socialLinks.facebook,
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M19.1 17.9h3.28l.52-4.02h-3.8v-2.2c0-1.06.34-1.78 1.9-1.78h2.02V6.3c-.35-.05-1.55-.15-2.95-.15-2.92 0-4.92 1.78-4.92 5.05v2.68h-3.3v4.02h3.3v10h3.95v-10Z" />
      </svg>
    ),
  },
  {
    key: "instagram",
    label: "Instagram",
    href: siteConfig.socialLinks.instagram,
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 8.05c2.6 0 2.9.01 3.93.06.95.04 1.47.2 1.81.33.46.18.78.39 1.12.73.34.34.55.66.73 1.12.13.34.29.86.33 1.81.05 1.03.06 1.33.06 3.93s-.01 2.9-.06 3.93c-.04.95-.2 1.47-.33 1.81-.18.46-.39.78-.73 1.12-.34.34-.66.55-1.12.73-.34.13-.86.29-1.81.33-1.03.05-1.33.06-3.93.06s-2.9-.01-3.93-.06c-.95-.04-1.47-.2-1.81-.33-.46-.18-.78-.39-1.12-.73-.34-.34-.55-.66-.73-1.12-.13-.34-.29-.86-.33-1.81-.05-1.03-.06-1.33-.06-3.93s.01-2.9.06-3.93c.04-.95.2-1.47.33-1.81.18-.46.39-.78.73-1.12.34-.34.66-.55 1.12-.73.34-.13.86-.29 1.81-.33 1.03-.05 1.33-.06 3.93-.06Zm0-2.8c-2.65 0-2.98.01-4.06.06-1.07.05-1.8.22-2.44.47-.66.26-1.22.6-1.78 1.16-.56.56-.9 1.12-1.16 1.78-.25.64-.42 1.37-.47 2.44-.05 1.08-.06 1.41-.06 4.06s.01 2.98.06 4.06c.05 1.07.22 1.8.47 2.44.26.66.6 1.22 1.16 1.78.56.56 1.12.9 1.78 1.16.64.25 1.37.42 2.44.47 1.08.05 1.41.06 4.06.06s2.98-.01 4.06-.06c1.07-.05 1.8-.22 2.44-.47.66-.26 1.22-.6 1.78-1.16.56-.56.9-1.12 1.16-1.78.25-.64.42-1.37.47-2.44.05-1.08.06-1.41.06-4.06s-.01-2.98-.06-4.06c-.05-1.07-.22-1.8-.47-2.44-.26-.66-.6-1.22-1.16-1.78-.56-.56-1.12-.9-1.78-1.16-.64-.25-1.37-.42-2.44-.47-1.08-.05-1.41-.06-4.06-.06Zm0 5.48a5.27 5.27 0 1 0 0 10.54 5.27 5.27 0 0 0 0-10.54Zm0 8.7a3.43 3.43 0 1 1 0-6.86 3.43 3.43 0 0 1 0 6.86Zm5.58-8.98a1.23 1.23 0 1 0 0-2.46 1.23 1.23 0 0 0 0 2.46Z" />
      </svg>
    ),
  },
];

type SocialLinksProps = {
  className?: string;
  iconOnly?: boolean;
};

export default function SocialLinks({ className = "", iconOnly = false }: SocialLinksProps) {
  const [publicLinks, setPublicLinks] = useState(siteConfig.socialLinks);

  useEffect(() => {
    getDoc(doc(db, "siteSettings", "main"))
      .then((snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        setPublicLinks((current) => ({
          ...current,
          whatsapp: data.whatsapp?.trim() || current.whatsapp,
          telegram: data.telegram?.trim() || current.telegram,
          youtube: data.youtube?.trim() || current.youtube,
          facebook: data.facebook?.trim() || current.facebook,
          instagram: data.instagram?.trim() || current.instagram,
        }));
      })
      .catch((error) => console.warn("Public social links unavailable", error));
  }, []);

  const modeClass = iconOnly ? "social-link-row-icons-only" : "";
  const resolvedSocialItems = socialItems.map((item) => ({
    ...item,
    href: publicLinks[item.key as keyof typeof publicLinks],
  }));

  return (
    <div className={`social-link-row ${modeClass} ${className}`.trim()}>
      {resolvedSocialItems.map((item) => {
        const isActive = isUsableSocialLink(item.href);
        const content = (
          <>
            <span className="social-icon">{item.icon}</span>
            {!iconOnly ? <span>{item.label}</span> : <span className="sr-only">{item.label}</span>}
          </>
        );

        if (!isActive) {
          return (
            <span
              key={item.key}
              className={`social-link social-${item.key} social-link-disabled`}
              title={`${item.label} link will be added soon`}
              aria-label={`${item.label} link will be added soon`}
            >
              {content}
            </span>
          );
        }

        return (
          <a
            key={item.key}
            href={item.href}
            target="_blank"
            rel="noreferrer"
            className={`social-link social-${item.key}`}
            aria-label={`Follow Odisha Sathi on ${item.label}`}
          >
            {content}
          </a>
        );
      })}
    </div>
  );
}
