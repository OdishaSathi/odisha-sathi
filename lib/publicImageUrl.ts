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

export function toImportantImageProxyUrl(value?: string, siteUrl?: string) {
  const normalized = normalizePublicImageUrl(value);
  if (!normalized) return "";

  const baseUrl = siteUrl || "https://odishasathi.in";

  try {
    const imageUrl = new URL(normalized, baseUrl);
    const site = new URL(baseUrl);

    if (imageUrl.origin === site.origin) {
      if (!siteUrl && normalized.startsWith("/")) return normalized;
      return imageUrl.toString();
    }

    const proxy = new URL("/api/important-image", site);
    proxy.searchParams.set("url", imageUrl.toString());
    return siteUrl ? proxy.toString() : `${proxy.pathname}${proxy.search}`;
  } catch {
    return normalized;
  }
}
