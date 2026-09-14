import { NextRequest, NextResponse } from "next/server";
import { normalizePublicImageUrl } from "@/lib/publicImageUrl";

export const runtime = "nodejs";
export const revalidate = 86400;

const IMAGE_TIMEOUT_MS = 8000;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_REDIRECTS = 3;

function isBlockedHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    host === "::" ||
    host === "::1"
  ) {
    return true;
  }
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return true;
  if (/^169\.254\./.test(host) || /^0\./.test(host)) return true;
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(host)) return true;
  if (/^198\.(1[89])\./.test(host)) return true;
  if (host.includes(":") && /^(fc|fd|fe[89ab])/i.test(host)) return true;
  const m = host.match(/^172\.(\d+)\./);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  return false;
}

function isSafeImageTarget(target: URL) {
  return /^https?:$/.test(target.protocol) && !isBlockedHost(target.hostname);
}

function fallbackOrError(
  request: NextRequest,
  message: string,
  status: number
) {
  const rawFallback = request.nextUrl.searchParams.get("fallback") || "";

  if (rawFallback) {
    try {
      const fallback = new URL(rawFallback, request.nextUrl.origin);
      const allowedPath =
        fallback.pathname.startsWith("/api/og/") ||
        fallback.pathname === "/odisha-sathi-logo.png";

      if (fallback.origin === request.nextUrl.origin && allowedPath) {
        return NextResponse.redirect(fallback, 307);
      }
    } catch {
      // Ignore an invalid fallback and return the original safe error below.
    }
  }

  return new NextResponse(message, { status });
}

async function fetchImageResponse(initialTarget: URL) {
  let target = initialTarget;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    if (!isSafeImageTarget(target)) {
      throw new Error("UNSAFE_IMAGE_TARGET");
    }

    const response = await fetch(target, {
      redirect: "manual",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 OdishaSathiImageProxy/1.0",
      },
      cache: "force-cache",
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    });

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }

    const location = response.headers.get("location");
    if (!location || redirectCount === MAX_REDIRECTS) {
      throw new Error("IMAGE_REDIRECT_FAILED");
    }

    target = new URL(location, target);
  }

  throw new Error("IMAGE_REDIRECT_FAILED");
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url") || "";
  const normalized = normalizePublicImageUrl(raw);

  try {
    const target = new URL(normalized);
    if (!isSafeImageTarget(target)) {
      return fallbackOrError(request, "Invalid image URL", 400);
    }

    const response = await fetchImageResponse(target);

    if (!response.ok) {
      return fallbackOrError(request, "Image unavailable", 404);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return fallbackOrError(request, "Unsupported image response", 415);
    }

    const declaredLength = Number(response.headers.get("content-length") || 0);
    if (declaredLength > MAX_IMAGE_BYTES) {
      return fallbackOrError(request, "Image too large", 413);
    }

    const data = await response.arrayBuffer();
    if (data.byteLength > MAX_IMAGE_BYTES) {
      return fallbackOrError(request, "Image too large", 413);
    }

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return fallbackOrError(request, "Image unavailable", 404);
  }
}
