import { getVercelOidcToken } from "@vercel/oidc";
import { ExternalAccountClient } from "google-auth-library";

const ANALYTICS_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

type AnalyticsRow = {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
};

type ReportResponse = { rows?: AnalyticsRow[] };
type BatchReportResponse = { reports?: ReportResponse[] };

type AnalyticsConfig = {
  projectNumber: string;
  poolId: string;
  providerId: string;
  serviceAccount: string;
  propertyId: string;
  stsAudience: string;
  oidcAudience: string;
};

export type AnalyticsDiagnostic = {
  code: string;
  title: string;
  message: string;
  action: string[];
  principal?: string;
  serviceAccount?: string;
};

export class AnalyticsConnectionError extends Error {
  readonly diagnostic: AnalyticsDiagnostic;

  constructor(diagnostic: AnalyticsDiagnostic) {
    super(diagnostic.message);
    this.name = "AnalyticsConnectionError";
    this.diagnostic = diagnostic;
  }
}

function connectionError(diagnostic: AnalyticsDiagnostic): never {
  throw new AnalyticsConnectionError(diagnostic);
}

function configuration(): AnalyticsConfig {
  const names = [
    "GCP_PROJECT_NUMBER",
    "GCP_WORKLOAD_IDENTITY_POOL_ID",
    "GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID",
    "GCP_SERVICE_ACCOUNT_EMAIL",
    "GA4_PROPERTY_ID",
  ] as const;

  const values = Object.fromEntries(
    names.map((name) => [name, process.env[name]?.trim() || ""]),
  ) as Record<(typeof names)[number], string>;
  const missing = names.filter((name) => !values[name]);

  if (missing.length) {
    connectionError({
      code: "CONFIG_MISSING",
      title: "Analytics configuration is incomplete",
      message: `The Production deployment is missing: ${missing.join(", ")}.`,
      action: [
        "Open the Vercel project that owns odishasathi.in: odisha-sathi-siuw.",
        `Add the missing Production variable${missing.length > 1 ? "s" : ""}, then redeploy Production.`,
      ],
    });
  }

  const propertyId = values.GA4_PROPERTY_ID.replace(/^properties\//i, "");
  if (!/^\d+$/.test(propertyId)) {
    connectionError({
      code: "INVALID_PROPERTY_ID",
      title: "The GA4 Property ID is not valid",
      message: "GA4_PROPERTY_ID must contain the numeric Property ID, not the G- measurement ID.",
      action: [
        "Open Google Analytics → Admin → Property details.",
        "Copy the numeric Property ID into GA4_PROPERTY_ID in Vercel and redeploy.",
      ],
    });
  }

  if (!/^\d+$/.test(values.GCP_PROJECT_NUMBER)) {
    connectionError({
      code: "INVALID_PROJECT_NUMBER",
      title: "The Google Cloud project number is not valid",
      message: "GCP_PROJECT_NUMBER must be the numeric project number, not the project name or project ID.",
      action: [
        "Open Google Cloud → IAM & Admin → Settings.",
        "Copy the numeric Project number into GCP_PROJECT_NUMBER in Vercel and redeploy.",
      ],
    });
  }

  if (!values.GCP_SERVICE_ACCOUNT_EMAIL.endsWith(".iam.gserviceaccount.com")) {
    connectionError({
      code: "INVALID_SERVICE_ACCOUNT",
      title: "The service-account email is not valid",
      message: "GCP_SERVICE_ACCOUNT_EMAIL does not contain a Google service-account email.",
      action: [
        "Open Google Cloud → IAM & Admin → Service Accounts.",
        "Copy the Analytics Reader service-account email into Vercel and redeploy.",
      ],
    });
  }

  const providerPath = `projects/${values.GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${values.GCP_WORKLOAD_IDENTITY_POOL_ID}/providers/${values.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID}`;

  return {
    projectNumber: values.GCP_PROJECT_NUMBER,
    poolId: values.GCP_WORKLOAD_IDENTITY_POOL_ID,
    providerId: values.GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID,
    serviceAccount: values.GCP_SERVICE_ACCOUNT_EMAIL,
    propertyId,
    stsAudience: `//iam.googleapis.com/${providerPath}`,
    oidcAudience: `https://iam.googleapis.com/${providerPath}`,
  };
}

function decodeOidcSubject(token: string) {
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return "";
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as { sub?: unknown };
    return typeof payload.sub === "string" ? payload.sub : "";
  } catch {
    return "";
  }
}

function expectedPrincipal(config: AnalyticsConfig, subject: string) {
  if (!subject) return undefined;
  return `principal://iam.googleapis.com/projects/${config.projectNumber}/locations/global/workloadIdentityPools/${config.poolId}/subject/${subject}`;
}

type AuthFailure = {
  error: unknown;
  stage: "oidc" | "sts" | "impersonation" | "unknown";
  status?: number;
  details: string;
};

function errorDetails(error: unknown) {
  const item = error as {
    message?: unknown;
    code?: unknown;
    response?: {
      status?: unknown;
      data?: unknown;
      config?: { url?: unknown };
    };
    config?: { url?: unknown };
  };
  const url = String(item?.response?.config?.url || item?.config?.url || "");
  const message = typeof item?.message === "string" ? item.message : "";
  let responseText = "";
  try {
    responseText = JSON.stringify(item?.response?.data || "");
  } catch {
    responseText = "";
  }
  const details = `${message} ${responseText}`.slice(0, 4_000);
  const status =
    typeof item?.response?.status === "number" ? item.response.status : undefined;

  let stage: AuthFailure["stage"] = "unknown";
  if (url.includes("iamcredentials.googleapis.com") || details.includes("iam.serviceAccounts.getAccessToken")) {
    stage = "impersonation";
  } else if (url.includes("sts.googleapis.com") || /invalid_(grant|target)|workload identity pool|attribute condition/i.test(details)) {
    stage = "sts";
  } else if (/vercel.*oidc|oidc.*token|x-vercel-oidc-token|VERCEL_OIDC_TOKEN/i.test(details)) {
    stage = "oidc";
  }

  return { error, stage, status, details } satisfies AuthFailure;
}

function chooseFurthestFailure(failures: AuthFailure[]) {
  const rank: Record<AuthFailure["stage"], number> = {
    oidc: 1,
    sts: 2,
    impersonation: 3,
    unknown: 0,
  };
  return failures.reduce((best, item) =>
    rank[item.stage] > rank[best.stage] ? item : best,
  );
}

function throwAuthenticationDiagnostic(
  failure: AuthFailure,
  config: AnalyticsConfig,
  principal?: string,
): never {
  const common = { principal, serviceAccount: config.serviceAccount };

  if (failure.stage === "oidc") {
    connectionError({
      ...common,
      code: "VERCEL_OIDC_UNAVAILABLE",
      title: "Vercel did not supply an OIDC token",
      message: "The server cannot obtain the short-lived Vercel identity token required by Google Cloud.",
      action: [
        "Confirm that odishasathi.in is attached to the Vercel project odisha-sathi-siuw.",
        "Redeploy that project from main; no private key is required.",
      ],
    });
  }

  if (failure.stage === "impersonation" || failure.status === 403) {
    connectionError({
      ...common,
      code: "IMPERSONATION_DENIED",
      title: "Google denied service-account impersonation",
      message: "Vercel reached Google Cloud, but the live deployment is not allowed to use the Analytics Reader service account.",
      action: [
        "Open Google Cloud → IAM & Admin → Workload Identity Federation → your Vercel pool → Grant access.",
        "Choose service-account impersonation and select the Odisha Sathi Analytics Reader service account.",
        "Grant Workload Identity User to the exact principal shown below. This must use project odisha-sathi-siuw and environment production.",
      ],
    });
  }

  if (failure.stage === "sts") {
    connectionError({
      ...common,
      code: "WIF_PROVIDER_REJECTED",
      title: "Google rejected the Vercel identity token",
      message: "The Workload Identity provider does not match the live Vercel issuer, audience, pool, or provider ID.",
      action: [
        "In the Google Workload Identity provider, use issuer https://oidc.vercel.com/odisha-sathi (team mode) or https://oidc.vercel.com (global mode).",
        "Keep google.subject mapped to assertion.sub.",
        "This code automatically supports both Google Default audience and Vercel team audience; redeploy after correcting the provider values.",
      ],
    });
  }

  connectionError({
    ...common,
    code: "GOOGLE_AUTH_FAILED",
    title: "Google authentication failed",
    message: "The keyless Google authentication request failed before Analytics could be queried.",
    action: [
      "Confirm the four GCP_* Production variables belong to the same Google Cloud project and provider.",
      "Redeploy Production after saving any corrected value.",
    ],
  });
}

async function exchangeForGoogleToken(
  config: AnalyticsConfig,
  subjectToken: string,
) {
  const client = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience: config.stsAudience,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${config.serviceAccount}:generateAccessToken`,
    scopes: [ANALYTICS_SCOPE],
    subject_token_supplier: {
      getSubjectToken: async () => subjectToken,
    },
  });

  if (!client) {
    connectionError({
      code: "GOOGLE_CLIENT_FAILED",
      title: "Google authentication client could not start",
      message: "The server could not initialize its keyless Google authentication client.",
      action: ["Redeploy the verified Analytics package and try again."],
    });
  }

  const result = await client.getAccessToken();
  if (!result.token) {
    connectionError({
      code: "GOOGLE_TOKEN_EMPTY",
      title: "Google returned no access token",
      message: "Authentication completed without a usable access token.",
      action: ["Redeploy the verified Analytics package and try again."],
    });
  }
  return result.token;
}

async function accessToken(config: AnalyticsConfig) {
  let defaultToken = "";
  try {
    defaultToken = await getVercelOidcToken();
  } catch (error) {
    throwAuthenticationDiagnostic(errorDetails(error), config);
  }

  const subject = decodeOidcSubject(defaultToken);
  const principal = expectedPrincipal(config, subject);
  const failures: AuthFailure[] = [];

  try {
    return await exchangeForGoogleToken(config, defaultToken);
  } catch (error) {
    if (error instanceof AnalyticsConnectionError) throw error;
    failures.push(errorDetails(error));
  }

  // Google supports two valid provider audience configurations. Try the
  // recommended provider-resource audience if the normal Vercel team audience
  // was rejected, so the deployment works with either console choice.
  if (failures[0]?.stage === "sts") {
    try {
      const providerToken = await getVercelOidcToken({
        audience: config.oidcAudience,
        skipCache: true,
      });
      return await exchangeForGoogleToken(config, providerToken);
    } catch (error) {
      if (error instanceof AnalyticsConnectionError) throw error;
      failures.push(errorDetails(error));
    }
  }

  throwAuthenticationDiagnostic(
    chooseFurthestFailure(failures),
    config,
    principal,
  );
}

function googleApiMessage(payload: string) {
  try {
    const parsed = JSON.parse(payload) as {
      error?: { message?: unknown; status?: unknown; details?: unknown };
    };
    return {
      message:
        typeof parsed.error?.message === "string" ? parsed.error.message : "",
      status: typeof parsed.error?.status === "string" ? parsed.error.status : "",
      details: JSON.stringify(parsed.error?.details || ""),
    };
  } catch {
    return { message: payload.slice(0, 500), status: "", details: "" };
  }
}

async function report<T>(
  path: string,
  body: object,
  token: string,
  config: AnalyticsConfig,
): Promise<T> {
  const response = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/${path}`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );

  if (response.ok) return (await response.json()) as T;

  const payload = await response.text();
  const apiError = googleApiMessage(payload);
  const combined = `${apiError.message} ${apiError.status} ${apiError.details}`;

  if (/ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficient authentication scopes/i.test(combined)) {
    connectionError({
      code: "GA4_SCOPE_REJECTED",
      title: "Google rejected the Analytics permission scope",
      message: "The Google access token does not include analytics.readonly.",
      action: ["Redeploy the verified Analytics package; it requests the required GA4 read-only scope."],
      serviceAccount: config.serviceAccount,
    });
  }

  if (/SERVICE_DISABLED|API has not been used|is disabled/i.test(combined)) {
    connectionError({
      code: "GA4_API_DISABLED",
      title: "Google Analytics Data API is disabled",
      message: "Authentication works, but the Analytics Data API is not enabled in the Google Cloud project.",
      action: [
        "Open Google Cloud → APIs & Services → Library.",
        "Enable Google Analytics Data API, wait one minute, then refresh this page.",
      ],
      serviceAccount: config.serviceAccount,
    });
  }

  if (response.status === 403) {
    connectionError({
      code: "GA4_ACCESS_DENIED",
      title: "The Analytics Reader cannot access this GA4 property",
      message: "Google authentication works, but this service account does not have access to the selected GA4 property.",
      action: [
        "Open Google Analytics → Admin → Property access management.",
        `Add ${config.serviceAccount} as Viewer for Property ${config.propertyId}.`,
        "Wait one minute, then refresh this page.",
      ],
      serviceAccount: config.serviceAccount,
    });
  }

  if (response.status === 404) {
    connectionError({
      code: "GA4_PROPERTY_NOT_FOUND",
      title: "The GA4 property was not found",
      message: `Google could not find or expose Property ${config.propertyId} to the Analytics Reader.`,
      action: [
        "Confirm GA4_PROPERTY_ID is the numeric Property ID from Google Analytics → Admin → Property details.",
        "Confirm the Analytics Reader service account has Viewer access to that same property.",
      ],
      serviceAccount: config.serviceAccount,
    });
  }

  if (response.status === 400) {
    connectionError({
      code: "GA4_REQUEST_REJECTED",
      title: "Google Analytics rejected the report request",
      message: apiError.message || "The GA4 report request was invalid.",
      action: ["Confirm the numeric Property ID, then redeploy the verified Analytics package."],
      serviceAccount: config.serviceAccount,
    });
  }

  connectionError({
    code: `GA4_HTTP_${response.status}`,
    title: "Google Analytics is temporarily unavailable",
    message: apiError.message || `Google Analytics returned HTTP ${response.status}.`,
    action: ["Wait one minute and refresh. If the same code remains, send only this diagnostic code."],
    serviceAccount: config.serviceAccount,
  });
}

const metricNumber = (row?: AnalyticsRow, index = 0) =>
  Number(row?.metricValues?.[index]?.value || 0);

export function publicAnalyticsDiagnostic(error: unknown): AnalyticsDiagnostic {
  if (error instanceof AnalyticsConnectionError) return error.diagnostic;
  return {
    code: "ANALYTICS_UNKNOWN_ERROR",
    title: "Analytics could not be loaded",
    message: "An unexpected server error occurred while loading Analytics.",
    action: ["Send only the diagnostic code shown here; do not send passwords, tokens, or private keys."],
  };
}

export async function getAnalyticsSummary() {
  const config = configuration();
  const token = await accessToken(config);
  const base = `properties/${config.propertyId}`;

  const [realtime, periods, pages, devices] = await Promise.all([
    report<ReportResponse>(
      `${base}:runRealtimeReport`,
      { metrics: [{ name: "activeUsers" }] },
      token,
      config,
    ),
    report<BatchReportResponse>(
      `${base}:batchRunReports`,
      {
        requests: [
          {
            dateRanges: [{ startDate: "today", endDate: "today" }],
            metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
          },
          {
            dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
            metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
          },
          {
            dateRanges: [{ startDate: "29daysAgo", endDate: "today" }],
            metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
          },
        ],
      },
      token,
      config,
    ),
    report<ReportResponse>(
      `${base}:runReport`,
      {
        dateRanges: [{ startDate: "29daysAgo", endDate: "today" }],
        dimensions: [{ name: "pageTitle" }, { name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [
          { metric: { metricName: "screenPageViews" }, desc: true },
        ],
        limit: 8,
      },
      token,
      config,
    ),
    report<ReportResponse>(
      `${base}:runReport`,
      {
        dateRanges: [{ startDate: "29daysAgo", endDate: "today" }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      },
      token,
      config,
    ),
  ]);

  const periodRows = periods.reports?.map((item) => item.rows?.[0]) || [];
  return {
    activeNow: metricNumber(realtime.rows?.[0]),
    today: {
      users: metricNumber(periodRows[0]),
      views: metricNumber(periodRows[0], 1),
    },
    sevenDays: {
      users: metricNumber(periodRows[1]),
      views: metricNumber(periodRows[1], 1),
    },
    thirtyDays: {
      users: metricNumber(periodRows[2]),
      views: metricNumber(periodRows[2], 1),
    },
    pages: (pages.rows || []).map((row) => ({
      title: row.dimensionValues?.[0]?.value || "Untitled",
      path: row.dimensionValues?.[1]?.value || "/",
      views: metricNumber(row),
    })),
    devices: (devices.rows || []).map((row) => ({
      name: row.dimensionValues?.[0]?.value || "other",
      users: metricNumber(row),
    })),
    updatedAt: new Date().toISOString(),
  };
}
