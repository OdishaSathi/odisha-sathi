import { siteConfig } from "@/lib/siteConfig";

function buildStructuredData() {
  const siteUrl = siteConfig.siteUrl.replace(/\/$/, "");

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteConfig.siteName,
        url: siteUrl,
        logo: `${siteUrl}/odisha-sathi-logo.png`,
        description: siteConfig.description,
        sameAs: Object.values(siteConfig.socialLinks || {}).filter(
          (value) => typeof value === "string" && value.trim() && value !== "#"
        ),
        address: siteConfig.contact.address
          ? {
              "@type": "PostalAddress",
              addressLocality: siteConfig.contact.address,
              addressRegion: "Odisha",
              addressCountry: "IN",
            }
          : undefined,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: siteConfig.siteName,
        url: siteUrl,
        description: siteConfig.description,
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export default function StructuredData() {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildStructuredData()) }}
    />
  );
}
