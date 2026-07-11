const SOCIAL_LINKS = [
  {
    name: "WhatsApp",
    href: "https://whatsapp.com/channel/YOUR_WHATSAPP_CHANNEL",
    className: "whatsapp",
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16.04 3.2A12.64 12.64 0 0 0 5.1 22.18L3.6 28.8l6.74-1.46A12.64 12.64 0 1 0 16.04 3.2Zm0 22.68a10 10 0 0 1-5.1-1.4l-.36-.22-4 .86.9-3.9-.24-.4a10.02 10.02 0 1 1 8.8 5.06Zm5.55-7.52c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.68-1.65-.94-2.25-.25-.6-.5-.5-.68-.52h-.58c-.2 0-.52.08-.8.37-.28.3-1.05 1.03-1.05 2.52s1.08 2.92 1.23 3.12c.15.2 2.13 3.25 5.16 4.56.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.18-1.43-.08-.13-.28-.2-.58-.35Z" />
      </svg>
    ),
  },
  {
    name: "Telegram",
    href: "https://t.me/YOUR_TELEGRAM_CHANNEL",
    className: "telegram",
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M27.8 5.1 4.9 13.92c-1.56.62-1.55 1.48-.28 1.87l5.88 1.84 2.25 6.9c.29.8.15 1.12.98 1.12.64 0 .92-.3 1.28-.64l3.08-3 6.4 4.73c1.17.65 2.02.31 2.32-1.08L31 6.48c.42-1.68-.64-2.44-3.2-1.38Zm-3.72 5.05L13.26 19.9l-.42 4.44-1.72-5.62 12.96-8.57Z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/YOUR_PAGE",
    className: "facebook",
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M19.1 17.9h3.28l.52-4.02h-3.8v-2.2c0-1.06.34-1.78 1.9-1.78h2.02V6.3c-.35-.05-1.55-.15-2.95-.15-2.92 0-4.92 1.78-4.92 5.05v2.68h-3.3v4.02h3.3v10h3.95v-10Z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/YOUR_USERNAME",
    className: "instagram",
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 8.05c2.6 0 2.9.01 3.93.06.95.04 1.47.2 1.81.33.46.18.78.39 1.12.73.34.34.55.66.73 1.12.13.34.29.86.33 1.81.05 1.03.06 1.33.06 3.93s-.01 2.9-.06 3.93c-.04.95-.2 1.47-.33 1.81-.18.46-.39.78-.73 1.12-.34.34-.66.55-1.12.73-.34.13-.86.29-1.81.33-1.03.05-1.33.06-3.93.06s-2.9-.01-3.93-.06c-.95-.04-1.47-.2-1.81-.33-.46-.18-.78-.39-1.12-.73-.34-.34-.55-.66-.73-1.12-.13-.34-.29-.86-.33-1.81-.05-1.03-.06-1.33-.06-3.93s.01-2.9.06-3.93c.04-.95.2-1.47.33-1.81.18-.46.39-.78.73-1.12.34-.34.66-.55 1.12-.73.34-.13.86-.29 1.81-.33 1.03-.05 1.33-.06 3.93-.06Zm0-2.8c-2.65 0-2.98.01-4.06.06-1.07.05-1.8.22-2.44.47-.66.26-1.22.6-1.78 1.16-.56.56-.9 1.12-1.16 1.78-.25.64-.42 1.37-.47 2.44-.05 1.08-.06 1.41-.06 4.06s.01 2.98.06 4.06c.05 1.07.22 1.8.47 2.44.26.66.6 1.22 1.16 1.78.56.56 1.12.9 1.78 1.16.64.25 1.37.42 2.44.47 1.08.05 1.41.06 4.06.06s2.98-.01 4.06-.06c1.07-.05 1.8-.22 2.44-.47.66-.26 1.22-.6 1.78-1.16.56-.56.9-1.12 1.16-1.78.25-.64.42-1.37.47-2.44.05-1.08.06-1.41.06-4.06s-.01-2.98-.06-4.06c-.05-1.07-.22-1.8-.47-2.44-.26-.66-.6-1.22-1.16-1.78-.56-.56-1.12-.9-1.78-1.16-.64-.25-1.37-.42-2.44-.47-1.08-.05-1.41-.06-4.06-.06Zm0 5.48a5.27 5.27 0 1 0 0 10.54 5.27 5.27 0 0 0 0-10.54Zm0 8.7a3.43 3.43 0 1 1 0-6.86 3.43 3.43 0 0 1 0 6.86Zm5.58-8.98a1.23 1.23 0 1 0 0-2.46 1.23 1.23 0 0 0 0 2.46Z" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@YOUR_CHANNEL",
    className: "youtube",
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M29.3 9.9a3.42 3.42 0 0 0-2.4-2.42C24.78 6.9 16.3 6.9 16.3 6.9s-8.48 0-10.6.58A3.42 3.42 0 0 0 3.3 9.9c-.57 2.13-.57 6.58-.57 6.58s0 4.45.57 6.58a3.42 3.42 0 0 0 2.4 2.42c2.12.58 10.6.58 10.6.58s8.48 0 10.6-.58a3.42 3.42 0 0 0 2.4-2.42c.57-2.13.57-6.58.57-6.58s0-4.45-.57-6.58ZM13.58 20.6v-8.24l7.04 4.12-7.04 4.12Z" />
      </svg>
    ),
  },
];

export default function SocialIconLinks({
  variant = "header",
}: {
  variant?: "header" | "home-mobile";
}) {
  return (
    <div className={`os-social-icons os-social-icons-${variant}`}>
      {SOCIAL_LINKS.map((item, index) => (
        <a
          key={item.name}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.name}
          className={`os-social-icon os-social-${item.className}`}
          style={{ animationDelay: `${index * 0.15}s` }}
        >
          {item.icon}
        </a>
      ))}

      <style jsx global>{`
        .os-social-icons {
          align-items: center;
          justify-content: center;
        }

        .os-social-icons-header {
          display: flex;
          gap: 8px;
          flex: 0 0 auto;
        }

        .os-social-icons-home-mobile {
          display: none;
        }

        .os-social-icon {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          text-decoration: none;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
          animation: osSocialSoftMove 3.2s ease-in-out infinite;
          transition:
            transform 0.16s ease,
            box-shadow 0.16s ease;
        }

        .os-social-icon:hover {
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 8px 16px rgba(15, 23, 42, 0.18);
        }

        .os-social-icon svg {
          width: 17px;
          height: 17px;
          fill: currentColor;
        }

        .os-social-whatsapp {
          background: #25d366;
        }

        .os-social-telegram {
          background: #229ed9;
        }

        .os-social-facebook {
          background: #1877f2;
        }

        .os-social-instagram {
          background:
            radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%);
        }

        .os-social-youtube {
          background: #ff0000;
        }

        @keyframes osSocialSoftMove {
          0% {
            transform: translateY(0) scale(1);
          }

          50% {
            transform: translateY(-1.5px) scale(1.02);
          }

          100% {
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 1024px) {
          .os-social-icons-header {
            display: none;
          }

          .os-social-icons-home-mobile {
            display: flex;
            gap: 12px;
            width: 100%;
            margin: 10px 0 14px;
            padding: 10px 12px;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            background: #ffffff;
            box-shadow: 0 8px 22px rgba(15, 23, 42, 0.05);
          }

          .os-social-icon {
            width: 35px;
            height: 35px;
          }

          .os-social-icon svg {
            width: 21px;
            height: 21px;
          }
        }

        @media (max-width: 420px) {
          .os-social-icons-home-mobile {
            gap: 10px;
          }

          .os-social-icon {
            width: 33px;
            height: 33px;
          }

          .os-social-icon svg {
            width: 19px;
            height: 19px;
          }
        }
      `}</style>
    </div>
  );
}