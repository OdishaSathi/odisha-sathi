"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { auth } from "@/lib/firebase";

type AnalyticsData = {
  activeNow: number;
  today: { users: number; views: number };
  sevenDays: { users: number; views: number };
  thirtyDays: { users: number; views: number };
  pages: { title: string; path: string; views: number }[];
  devices: { name: string; users: number }[];
  updatedAt: string;
};

type Diagnostic = {
  code: string;
  title: string;
  message: string;
  action: string[];
  principal?: string;
  serviceAccount?: string;
};

class DashboardRequestError extends Error {
  readonly diagnostic?: Diagnostic;

  constructor(message: string, diagnostic?: Diagnostic) {
    super(message);
    this.name = "DashboardRequestError";
    this.diagnostic = diagnostic;
  }
}

async function requestAnalytics(forceRefresh = false): Promise<AnalyticsData> {
  const user = auth.currentUser;
  if (!user) throw new DashboardRequestError("Please sign in again.");

  const token = await user.getIdToken(forceRefresh);
  const response = await fetch("/api/admin/analytics", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const result = (await response.json().catch(() => ({}))) as {
    error?: string;
    diagnostic?: Diagnostic;
  } & Partial<AnalyticsData>;

  if (response.status === 401 && !forceRefresh) {
    return requestAnalytics(true);
  }
  if (!response.ok) {
    throw new DashboardRequestError(
      result.error || "Unable to load Analytics.",
      result.diagnostic,
    );
  }
  return result as AnalyticsData;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<DashboardRequestError | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      setData(await requestAnalytics());
    } catch (requestError) {
      setError(
        requestError instanceof DashboardRequestError
          ? requestError
          : new DashboardRequestError(
              requestError instanceof Error
                ? requestError.message
                : "Unable to load Analytics.",
            ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyPrincipal() {
    const principal = error?.diagnostic?.principal;
    if (!principal) return;
    await navigator.clipboard.writeText(principal);
    setCopied(true);
  }

  const cards = data
    ? [
        {
          label: "Active now",
          value: data.activeNow,
          note: "Last 30 minutes",
        },
        {
          label: "Today",
          value: data.today.users,
          note: `${data.today.views} page views`,
        },
        {
          label: "Last 7 days",
          value: data.sevenDays.users,
          note: `${data.sevenDays.views} page views`,
        },
        {
          label: "Last 30 days",
          value: data.thirtyDays.users,
          note: `${data.thirtyDays.views} page views`,
        },
      ]
    : [];

  const diagnostic = error?.diagnostic;

  return (
    <AdminLayout>
      <main className="analytics-page">
        <header className="analytics-header">
          <div>
            <h1>Website Analytics</h1>
            <p>Genuine visitor data from Google Analytics 4</p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={17} className={loading ? "spin" : ""} />
            {loading ? "Checking" : "Refresh"}
          </button>
        </header>

        {error ? (
          <section className="diagnostic-card" role="alert">
            <div className="diagnostic-heading">
              <AlertTriangle size={25} />
              <div>
                <span className="diagnostic-code">
                  {diagnostic?.code || "ANALYTICS_REQUEST_FAILED"}
                </span>
                <h2>{diagnostic?.title || "Analytics could not be loaded"}</h2>
                <p>{diagnostic?.message || error.message}</p>
              </div>
            </div>

            {diagnostic?.action?.length ? (
              <div className="diagnostic-actions">
                <h3>Exact correction</h3>
                <ol>
                  {diagnostic.action.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : null}

            {diagnostic?.principal ? (
              <div className="principal-box">
                <span>Principal required by the live deployment</span>
                <code>{diagnostic.principal}</code>
                <button type="button" onClick={() => void copyPrincipal()}>
                  <Copy size={15} /> {copied ? "Copied" : "Copy principal"}
                </button>
              </div>
            ) : null}

            {diagnostic?.serviceAccount ? (
              <p className="service-account">
                Service account: <code>{diagnostic.serviceAccount}</code>
              </p>
            ) : null}

            <button className="retry-button" type="button" onClick={() => void load()}>
              Check again
            </button>
          </section>
        ) : null}

        {loading && !data ? (
          <section className="loading-panel">
            <span className="loading-dot" />
            Checking the secure GA4 connection…
          </section>
        ) : null}

        {data ? (
          <>
            <section className="connection-ok">
              <CheckCircle2 size={20} />
              <div>
                <strong>Google Analytics connection is working</strong>
                <span>Keyless, read-only access verified</span>
              </div>
            </section>

            <section className="analytics-cards">
              {cards.map((card) => (
                <article key={card.label}>
                  <span>{card.label}</span>
                  <strong>{card.value.toLocaleString("en-IN")}</strong>
                  <small>{card.note}</small>
                </article>
              ))}
            </section>

            <div className="analytics-tables">
              <section>
                <h2>Popular pages · 30 days</h2>
                {data.pages.length ? (
                  data.pages.map((page) => (
                    <div className="analytics-row" key={`${page.path}-${page.title}`}>
                      <span>
                        <b>{page.title}</b>
                        <small>{page.path}</small>
                      </span>
                      <strong>{page.views.toLocaleString("en-IN")}</strong>
                    </div>
                  ))
                ) : (
                  <p>No page data yet.</p>
                )}
              </section>

              <section>
                <h2>Devices · 30 days</h2>
                {data.devices.length ? (
                  data.devices.map((device) => (
                    <div className="analytics-row" key={device.name}>
                      <b>{device.name}</b>
                      <strong>{device.users.toLocaleString("en-IN")}</strong>
                    </div>
                  ))
                ) : (
                  <p>No device data yet.</p>
                )}
              </section>
            </div>

            <p className="analytics-updated">
              Updated {new Date(data.updatedAt).toLocaleString("en-IN")}
            </p>
          </>
        ) : null}
      </main>

      <style jsx>{`
        .analytics-page{display:grid;gap:18px;max-width:1100px}.analytics-header{display:flex;justify-content:space-between;align-items:center;gap:16px}.analytics-header h1{margin:0;color:#172b4d;font-size:25px}.analytics-header p{margin:5px 0 0;color:#64748b}.analytics-header button,.retry-button,.principal-box button{border:0;border-radius:9px;background:#2563eb;color:#fff;padding:10px 14px;font-weight:750;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:7px}.analytics-header button:disabled{opacity:.65;cursor:wait}.spin{animation:spin .85s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}
        .loading-panel,.connection-ok,.analytics-cards article,.analytics-tables section,.diagnostic-card{background:#fff;border:1px solid #e2e8f0;border-radius:13px;padding:18px}.loading-panel{display:flex;align-items:center;gap:10px;color:#475569}.loading-dot{width:10px;height:10px;border-radius:50%;background:#2563eb;box-shadow:0 0 0 5px #dbeafe;animation:pulse 1.15s ease-in-out infinite}@keyframes pulse{50%{opacity:.4}}
        .connection-ok{display:flex;align-items:center;gap:11px;border-color:#bbf7d0;background:#f0fdf4;color:#15803d}.connection-ok div{display:grid;gap:2px}.connection-ok span{font-size:12px;color:#4d7c5b}
        .diagnostic-card{display:grid;gap:17px;border-color:#fed7aa;background:#fffaf5;color:#7c2d12}.diagnostic-heading{display:flex;align-items:flex-start;gap:12px}.diagnostic-heading>svg{flex:none;color:#ea580c;margin-top:2px}.diagnostic-code{display:inline-block;padding:4px 8px;border-radius:999px;background:#ffedd5;color:#9a3412;font-size:11px;font-weight:850;letter-spacing:.04em}.diagnostic-heading h2{margin:8px 0 5px;font-size:19px;color:#7c2d12}.diagnostic-heading p{margin:0;line-height:1.55;color:#9a3412}.diagnostic-actions{padding:14px 16px;border-radius:10px;background:#fff;border:1px solid #fed7aa}.diagnostic-actions h3{margin:0 0 9px;font-size:15px;color:#7c2d12}.diagnostic-actions ol{margin:0;padding-left:22px;display:grid;gap:7px;line-height:1.5;color:#7c2d12}.principal-box{display:grid;gap:8px;padding:14px;border-radius:10px;background:#172b4d;color:#dbeafe}.principal-box>span{font-size:12px;font-weight:750}.principal-box code{display:block;overflow-wrap:anywhere;line-height:1.5;color:#fff}.principal-box button{width:max-content;background:#fff;color:#174a8b;padding:8px 11px}.service-account{margin:0;overflow-wrap:anywhere;font-size:13px}.retry-button{width:max-content}
        .analytics-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.analytics-cards span,.analytics-cards small{display:block;color:#64748b}.analytics-cards strong{display:block;margin:7px 0;font-size:29px;color:#172b4d}.analytics-tables{display:grid;grid-template-columns:2fr 1fr;gap:16px}.analytics-tables h2{font-size:17px;margin:0 0 12px;color:#172b4d}.analytics-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:11px 0;border-top:1px solid #eef2f7}.analytics-row span{min-width:0}.analytics-row b,.analytics-row small{display:block}.analytics-row span b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.analytics-row small{color:#94a3b8;margin-top:3px}.analytics-updated{text-align:right;color:#94a3b8;font-size:12px;margin:0}
        @media(max-width:850px){.analytics-cards{grid-template-columns:repeat(2,1fr)}.analytics-tables{grid-template-columns:1fr}}
        @media(max-width:520px){.analytics-page{gap:14px}.analytics-header{align-items:flex-start}.analytics-header h1{font-size:21px}.analytics-header p{font-size:13px}.analytics-header button{font-size:0;width:43px;height:43px;padding:0;flex:none}.analytics-header button svg{width:19px;height:19px}.analytics-cards{gap:9px}.analytics-cards article{padding:14px}.analytics-cards strong{font-size:24px}.diagnostic-card{padding:15px}.diagnostic-heading h2{font-size:17px}.principal-box button{width:100%;font-size:13px}.retry-button{width:100%}}
      `}</style>
    </AdminLayout>
  );
}
