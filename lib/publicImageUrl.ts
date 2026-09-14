export function normalizePublicImageUrl(value?: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (raw.startsWith("//")) return `https:${raw}`;

  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();

    if (host === "drive.google.com") {
      const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
      const id = fileMatch?.[1] || url.searchParams.get("id") || "";
      if (id) return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;
    }

    if (host === "www.dropbox.com" || host === "dropbox.com") {
      url.hostname = "dl.dropboxusercontent.com";
      url.searchParams.delete("dl");
      url.searchParams.delete("raw");
      return url.toString();
    }

    return url.toString();
  } catch {
    return raw;
  }
}

export function isSupportedPublicImageUrl(value?: string) {
  const normalized = normalizePublicImageUrl(value);
  if (!normalized) return true;
  if (normalized.startsWith("/") && !normalized.startsWith("//")) return true;

  try {
    return /^https?:$/.test(new URL(normalized).protocol);
  } catch {
    return false;
  }
}

export function toImportantImageProxyUrl(
  value?: string,
  siteUrl?: string,
  fallbackValue?: string
) {
  const normalized = normalizePublicImageUrl(value);
  if (!normalized) return "";

  const baseUrl = siteUrl || "https://odishasathi.in";

  try {
    const imageUrl = new URL(normalized, baseUrl);
    const site = new URL(baseUrl);

    const isBuiltInImage =
      imageUrl.pathname.startsWith("/api/og/") ||
      imageUrl.pathname.startsWith("/api/important-image") ||
      imageUrl.pathname === "/odisha-sathi-logo.png";

    if (imageUrl.origin === site.origin && isBuiltInImage) {
      if (!siteUrl && normalized.startsWith("/")) return normalized;
      return imageUrl.toString();
    }

    const proxy = new URL("/api/important-image", site);
    proxy.searchParams.set("url", imageUrl.toString());

    if (fallbackValue) {
      const fallbackUrl = new URL(fallbackValue, site);
      const isSafeFallback =
        fallbackUrl.origin === site.origin &&
        (fallbackUrl.pathname.startsWith("/api/og/") ||
          fallbackUrl.pathname === "/odisha-sathi-logo.png");

      if (isSafeFallback) {
        proxy.searchParams.set(
          "fallback",
          siteUrl
            ? fallbackUrl.toString()
            : `${fallbackUrl.pathname}${fallbackUrl.search}`
        );
      }
    }

    return siteUrl ? proxy.toString() : `${proxy.pathname}${proxy.search}`;
  } catch {
    return normalized;
  }
}
