import sharp from "sharp";

export const runtime = "nodejs";

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;

function isPrivateHostname(hostname: string) {
  const host = hostname.toLowerCase();

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host === "metadata.google.internal"
  ) {
    return true;
  }

  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  return (
    parts[0] === 10 ||
    parts[0] === 127 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

function getSafeSourceUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (isPrivateHostname(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

function getFallbackUrl(requestUrl: URL) {
  const value = requestUrl.searchParams.get("fallback");
  if (!value || !value.startsWith("/api/og/post?")) return null;
  return new URL(value, requestUrl.origin);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const sourceUrl = getSafeSourceUrl(requestUrl.searchParams.get("src"));
  const fallbackUrl = getFallbackUrl(requestUrl);

  try {
    if (!sourceUrl) throw new Error("Invalid image source");

    const response = await fetch(sourceUrl, {
      signal: AbortSignal.timeout(10_000),
      headers: {
        Accept: "image/avif,image/webp,image/png,image/jpeg,image/*",
      },
    });

    if (!response.ok) {
      throw new Error(`Image source returned ${response.status}`);
    }

    const declaredSize = Number(response.headers.get("content-length") || 0);
    if (declaredSize > MAX_SOURCE_BYTES) {
      throw new Error("Image source is too large");
    }

    const sourceBuffer = Buffer.from(await response.arrayBuffer());
    if (sourceBuffer.length > MAX_SOURCE_BYTES) {
      throw new Error("Image source is too large");
    }

    const image = await sharp(sourceBuffer)
      .rotate()
      .resize(1200, 630, {
        fit: "contain",
        background: { r: 248, g: 250, b: 252 },
        withoutEnlargement: false,
      })
      .jpeg({ quality: 90, progressive: true })
      .toBuffer();

    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch (error) {
    console.warn("Share thumbnail generation failed", error);

    if (fallbackUrl) {
      return Response.redirect(fallbackUrl, 307);
    }

    return new Response("Thumbnail unavailable", { status: 404 });
  }
}
