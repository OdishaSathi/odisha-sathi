import { createRemoteJWKSet, jwtVerify } from "jose";
import { isApprovedAdminUid } from "@/lib/adminAccess";

const firebaseKeys = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

export async function verifyAdminRequest(request: Request) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!projectId || !token) throw new Error("UNAUTHENTICATED");

  const { payload } = await jwtVerify(token, firebaseKeys, {
    audience: projectId,
    issuer: `https://securetoken.google.com/${projectId}`,
  });

  const uid = String(payload.sub || payload.user_id || "").trim();
  if (!isApprovedAdminUid(uid)) {
    throw new Error("FORBIDDEN");
  }

  const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const email = String(payload.email || "").toLowerCase();

  if (allowedEmails.length > 0 && !allowedEmails.includes(email)) {
    throw new Error("FORBIDDEN");
  }

  return payload;
}
