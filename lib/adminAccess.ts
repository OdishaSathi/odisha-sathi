const APPROVED_ADMIN_UIDS = new Set([
  "xPFk3LWZhjMlPbGf77otc4kiuUT2",
]);

export function isApprovedAdminUid(value: unknown) {
  const uid = String(value || "").trim();
  return Boolean(uid) && APPROVED_ADMIN_UIDS.has(uid);
}
