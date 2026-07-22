import { NextResponse } from "next/server";
import {
  getAnalyticsSummary,
  publicAnalyticsDiagnostic,
} from "@/lib/server/googleAnalytics";
import { verifyAdminRequest } from "@/lib/server/verifyAdminToken";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const privateHeaders = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  try {
    await verifyAdminRequest(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNAUTHENTICATED";
    const forbidden = message === "FORBIDDEN";
    return NextResponse.json(
      {
        error: forbidden ? "This account is not an approved administrator." : "Your admin session has expired. Please sign in again.",
        code: forbidden ? "FORBIDDEN" : "UNAUTHENTICATED",
      },
      { status: forbidden ? 403 : 401, headers: privateHeaders },
    );
  }

  try {
    return NextResponse.json(await getAnalyticsSummary(), {
      headers: privateHeaders,
    });
  } catch (error) {
    const diagnostic = publicAnalyticsDiagnostic(error);
    console.error("Admin analytics error:", diagnostic.code);
    return NextResponse.json(
      {
        error: diagnostic.message,
        diagnostic,
      },
      { status: 503, headers: privateHeaders },
    );
  }
}
