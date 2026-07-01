"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const WHATSAPP_CHANNEL_LINK =
  "https://whatsapp.com/channel/0029Va9mvn72P59nNU9nEJ3I";

const LOGO_PATH = "/odisha-sathi-logo.png";

function shouldHidePopup(pathname: string): boolean {
  if (!pathname) return true;

  if (pathname === "/") return true;
  if (pathname === "/tools") return true;
  if (pathname.startsWith("/tools/")) return true;
  if (pathname === "/admin") return true;
  if (pathname.startsWith("/admin/")) return true;

  return false;
}

export default function WhatsAppFollowPopup() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const hidePopup = useMemo(() => {
    return shouldHidePopup(pathname || "");
  }, [pathname]);

  useEffect(() => {
    if (hidePopup) {
      setVisible(false);
      return;
    }

    setVisible(true);
    setLogoFailed(false);

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [hidePopup, pathname]);

  if (hidePopup || !visible) {
    return null;
  }

  return (
    <a
      href={WHATSAPP_CHANNEL_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Follow Odisha Sathi WhatsApp Channel"
      style={{
        position: "fixed",
        right: "16px",
        bottom: "18px",
        zIndex: 9999,
        width: "min(330px, calc(100vw - 32px))",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 14px",
        borderRadius: "18px",
        background: "#ffffff",
        border: "1px solid rgba(22, 163, 74, 0.22)",
        boxShadow: "0 16px 38px rgba(15, 23, 42, 0.22)",
        textDecoration: "none",
        color: "#0f172a",
        animation: "odishaSathiPopupIn 180ms ease-out",
      }}
    >
      <style>
        {`
          @keyframes odishaSathiPopupIn {
            from {
              opacity: 0;
              transform: translateY(12px) scale(0.98);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>

      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          overflow: "hidden",
          flex: "0 0 auto",
          background: "linear-gradient(135deg, #16a34a, #0f766e)",
          display: "grid",
          placeItems: "center",
          color: "#ffffff",
          fontWeight: 900,
          fontSize: "18px",
          border: "2px solid #dcfce7",
        }}
      >
        {!logoFailed ? (
          <img
            src={LOGO_PATH}
            alt="Odisha Sathi"
            onError={() => setLogoFailed(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          "OS"
        )}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: "13px",
            lineHeight: 1.2,
            color: "#16a34a",
            fontWeight: 900,
            marginBottom: "4px",
          }}
        >
          Odisha Sathi
        </div>

        <div
          style={{
            fontSize: "14px",
            lineHeight: 1.35,
            color: "#0f172a",
            fontWeight: 800,
          }}
        >
          Follow our WhatsApp channel for daily updates
        </div>
      </div>

      <div
        style={{
          flex: "0 0 auto",
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "#dcfce7",
          color: "#16a34a",
          display: "grid",
          placeItems: "center",
          fontWeight: 900,
          fontSize: "16px",
        }}
      >
        ›
      </div>
    </a>
  );
}