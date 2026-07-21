import { createRemoteJWKSet, jwtVerify } from "jose";

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

  const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const email = String(payload.email || "").toLowerCase();

  if (allowedEmails.length && !allowedEmails.includes(email)) {
    throw new Error("FORBIDDEN");
  }

  return payload;
}
