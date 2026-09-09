import { NextRequest, NextResponse } from "next/server";
import { normalizePublicImageUrl } from "@/lib/publicImageUrl";

export const runtime = "nodejs";
export const revalidate = 86400;

function isBlockedHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host === "0.0.0.0" || host === "::1") return true;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return true;
  const m = host.match(/^172\.(\d+)\./);
  if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
  return false;
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url") || "";
  const normalized = normalizePublicImageUrl(raw);

  try {
    const target = new URL(normalized);
    if (!/^https?:$/.test(target.protocol) || isBlockedHost(target.hostname)) {
      return new NextResponse("Invalid image URL", { status: 400 });
    }

    const response = await fetch(target, {
      redirect: "follow",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 OdishaSathiImageProxy/1.0",
      },
      cache: "force-cache",
    });

    if (!response.ok) return new NextResponse("Image unavailable", { status: 404 });

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return new NextResponse("Unsupported image response", { status: 415 });
    }

    const data = await response.arrayBuffer();
    if (data.byteLength > 10 * 1024 * 1024) {
      return new NextResponse("Image too large", { status: 413 });
    }

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return new NextResponse("Invalid image URL", { status: 400 });
  }
}
