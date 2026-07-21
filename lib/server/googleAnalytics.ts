import { getVercelOidcToken } from "@vercel/oidc";
import { ExternalAccountClient } from "google-auth-library";

type AnalyticsRow = { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] };

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`MISSING_${name}`);
  return value;
}

async function accessToken() {
  const projectNumber = required("GCP_PROJECT_NUMBER");
  const poolId = required("GCP_WORKLOAD_IDENTITY_POOL_ID");
  const providerId = required("GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID");
  const serviceAccount = required("GCP_SERVICE_ACCOUNT_EMAIL");

  const client = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccount}:generateAccessToken`,
    subject_token_supplier: { getSubjectToken: getVercelOidcToken },
  });
  if (!client) throw new Error("GOOGLE_AUTH_CLIENT_FAILED");
  const result = await client.getAccessToken();
  if (!result.token) throw new Error("GOOGLE_ACCESS_TOKEN_FAILED");
  return result.token;
}

async function report(path: string, body: object, token: string) {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`GA4_${response.status}_${await response.text()}`);
  return response.json();
}

const number = (row?: AnalyticsRow, index = 0) => Number(row?.metricValues?.[index]?.value || 0);

export async function getAnalyticsSummary() {
  const property = required("GA4_PROPERTY_ID");
  const token = await accessToken();
  const base = `properties/${property}`;
  const [realtime, periods, pages, devices] = await Promise.all([
    report(`${base}:runRealtimeReport`, { metrics: [{ name: "activeUsers" }] }, token),
    report(`${base}:batchRunReports`, { requests: [
      { dateRanges: [{ startDate: "today", endDate: "today" }], metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }] },
      { dateRanges: [{ startDate: "7daysAgo", endDate: "today" }], metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }] },
      { dateRanges: [{ startDate: "29daysAgo", endDate: "today" }], metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }] },
    ] }, token),
    report(`${base}:runReport`, { dateRanges: [{ startDate: "29daysAgo", endDate: "today" }], dimensions: [{ name: "pageTitle" }, { name: "pagePath" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 8 }, token),
    report(`${base}:runReport`, { dateRanges: [{ startDate: "29daysAgo", endDate: "today" }], dimensions: [{ name: "deviceCategory" }], metrics: [{ name: "activeUsers" }], orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }] }, token),
  ]);

  const periodRows = periods.reports?.map((item: any) => item.rows?.[0]) || [];
  return {
    activeNow: number(realtime.rows?.[0]),
    today: { users: number(periodRows[0]), views: number(periodRows[0], 1) },
    sevenDays: { users: number(periodRows[1]), views: number(periodRows[1], 1) },
    thirtyDays: { users: number(periodRows[2]), views: number(periodRows[2], 1) },
    pages: (pages.rows || []).map((row: AnalyticsRow) => ({ title: row.dimensionValues?.[0]?.value || "Untitled", path: row.dimensionValues?.[1]?.value || "/", views: number(row) })),
    devices: (devices.rows || []).map((row: AnalyticsRow) => ({ name: row.dimensionValues?.[0]?.value || "other", users: number(row) })),
    updatedAt: new Date().toISOString(),
  };
}
