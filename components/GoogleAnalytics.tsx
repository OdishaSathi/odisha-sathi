"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const measurementId =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-QB3L8E0FPG";

export default function GoogleAnalytics() {
  const pathname = usePathname();

  // Do not count admin work or admin-login visits as public website traffic.
  if (!measurementId || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            anonymize_ip: true
          });
        `}
      </Script>
    </>
  );
}
