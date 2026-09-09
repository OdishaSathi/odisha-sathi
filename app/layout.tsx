import type { Metadata } from "next";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import StructuredData from "@/components/StructuredData";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { getServerPublicSiteSettings } from "@/lib/server/publicSiteSettings";
import { GoogleAnalytics as NextGoogleAnalytics } from "@next/third-parties/google";

export const revalidate = 300;

function safeSiteUrl(value: string) {
  try {
    return new URL(value).toString();
  } catch {
    return "https://odishasathi.in";
  }
}

function keywordList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getServerPublicSiteSettings();
  const siteUrl = safeSiteUrl(settings.siteUrl || "https://odishasathi.in");
  const shareImage =
    settings.defaultShareImageUrl ||
    "/api/og/post?category=Update&department=Odisha%20Sathi&posts=Jobs%2C%20Admissions%2C%20Results%2C%20Citizen%20Services";
  const favicon = settings.faviconUrl || "/odisha-sathi-logo.png";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: settings.defaultSeoTitle,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.defaultSeoDescription,
    applicationName: settings.siteName,
    authors: [{ name: settings.siteName }],
    creator: settings.siteName,
    publisher: settings.siteName,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: "/",
    },
    keywords: keywordList(settings.defaultKeywords),
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: siteUrl,
      siteName: settings.siteName,
      title: settings.defaultSeoTitle,
      description: settings.defaultSeoDescription,
      images: [
        {
          url: shareImage,
          width: 1200,
          height: 630,
          alt: settings.siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.defaultSeoTitle,
      description: settings.defaultSeoDescription,
      images: [shareImage],
    },
    icons: {
      icon: favicon,
      apple: favicon,
    },
    verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        }
      : undefined,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getServerPublicSiteSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <StructuredData />
        <GoogleAnalytics />
        <SiteShell initialSettings={settings}>{children}</SiteShell>
{process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
  <NextGoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
) : null}
      </body>
    </html>
  );
}
