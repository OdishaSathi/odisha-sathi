"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const measurementId =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-QB3L8E0FPG";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const [loaded, setLoaded] = useState(false);
  const publicPage = Boolean(measurementId) && !pathname.startsWith("/admin");

  useEffect(() => {
    if (!publicPage || !loaded || !window.gtag) return;

    window.gtag("event", "page_view", {
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [loaded, pathname, publicPage]);

  if (!publicPage) return null;

  function prepareTracking() {
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      ((...args: unknown[]) => {
        window.dataLayer?.push(args);
      });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      anonymize_ip: true,
      send_page_view: false,
    });
    setLoaded(true);
  }

  return (
    <Script
      id="google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      strategy="afterInteractive"
      onReady={prepareTracking}
    />
  );
}
