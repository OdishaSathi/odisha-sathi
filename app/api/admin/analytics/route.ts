import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/server/googleAnalytics";
import { verifyAdminRequest } from "@/lib/server/verifyAdminToken";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await verifyAdminRequest(request);
    return NextResponse.json(await getAnalyticsSummary(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    console.error("Admin analytics error:", message);
    const status = message === "UNAUTHENTICATED" ? 401 : message === "FORBIDDEN" ? 403 : 503;
    return NextResponse.json({ error: status === 503 ? "Analytics is temporarily unavailable." : "Access denied." }, { status });
  }
}
