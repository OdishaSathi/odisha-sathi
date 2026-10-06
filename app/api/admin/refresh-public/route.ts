import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { verifyAdminRequest } from "@/lib/server/verifyAdminToken";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fixed allowlist: clients cannot invalidate arbitrary routes or admin pages.
const PUBLIC_PAGES = [
  "/", "/jobs", "/jobs/[subCategory]", "/admissions",
  "/admissions/[subCategory]", "/results", "/results/[subCategory]",
  "/admit-cards", "/admit-cards/[subCategory]", "/citizen-services",
  "/citizen-services/[slug]", "/citizen-services/category/[subCategory]",
  "/schemes", "/schemes/[id]", "/tools", "/tools/[toolCategory]",
  "/post/[slug]", "/important-information/[slug]", "/category/[category]",
  "/search", "/sitemap", "/about", "/contact", "/privacy-policy",
  "/terms-and-conditions", "/disclaimer", "/correction-request",
] as const;

const headers = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  try {
    await verifyAdminRequest(request);
  } catch (error) {
    const forbidden = error instanceof Error && error.message === "FORBIDDEN";
    return NextResponse.json(
      { error: forbidden ? "Admin access required." : "Please sign in again." },
      { status: forbidden ? 403 : 401, headers },
    );
  }

  try {
    for (const path of PUBLIC_PAGES) revalidatePath(path, "page");
    revalidatePath("/sitemap.xml");
    revalidateTag("public-search");
    return NextResponse.json({ ok: true }, { headers });
  } catch {
    return NextResponse.json(
      { error: "Refresh failed. Your saved posts are unchanged. Please retry." },
      { status: 500, headers },
    );
  }
}
