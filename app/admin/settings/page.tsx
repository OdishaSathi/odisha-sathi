"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import AdminLayout from "@/components/admin/AdminLayout";
import { db } from "@/lib/firebase";

type QuickAccessLink = {
  label: string;
  href: string;
  order: number;
  enabled: boolean;
};

type SettingsForm = {
  siteName: string;
  tagline: string;
  siteUrl: string;
  logoUrl: string;
  faviconUrl: string;
  email: string;
  phone: string;
  address: string;
  whatsapp: string;
  youtube: string;
  instagram: string;
  facebook: string;
  telegram: string;
  showImportantInformation: boolean;
  topImportantTiles: number;
  latestPostsCount: number;
  showLastDateReminder: boolean;
  showLatestSchemes: boolean;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  defaultKeywords: string;
  defaultShareImageUrl: string;
  quickAccessLinks: QuickAccessLink[];
};

const defaultSettings: SettingsForm = {
  siteName: "Odisha Sathi",
  tagline: "Jobs, Results, Admissions, Admit Cards & Exams & Schemes",
  siteUrl: "https://odishasathi.in",
  logoUrl: "",
  faviconUrl: "",
  email: "",
  phone: "",
  address: "",
  whatsapp: "",
  youtube: "",
  instagram: "",
  facebook: "",
  telegram: "",
  showImportantInformation: true,
  topImportantTiles: 8,
  latestPostsCount: 10,
  showLastDateReminder: true,
  showLatestSchemes: true,
  defaultSeoTitle: "Odisha Sathi",
  defaultSeoDescription:
    "Latest Odisha jobs, admissions, admit cards, exams, results, scholarships and government scheme updates.",
  defaultKeywords:
    "Odisha jobs, Odisha result, Odisha admission, Odisha admit card, Odisha schemes",
  defaultShareImageUrl: "",
  quickAccessLinks: [
    { label: "Latest Jobs", href: "/jobs", order: 1, enabled: true },
    { label: "Admissions", href: "/admissions", order: 2, enabled: true },
    { label: "Admit Cards & Exams", href: "/admit-cards", order: 3, enabled: true },
    { label: "Results", href: "/results", order: 4, enabled: true },
    { label: "Schemes", href: "/schemes", order: 5, enabled: true },
    { label: "Tools", href: "/tools", order: 6, enabled: true },
  ],
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "18px",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "14px",
  fontWeight: 800,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

function normalizeQuickAccessLinks(links: unknown): QuickAccessLink[] {
  if (!Array.isArray(links)) return defaultSettings.quickAccessLinks;

  return links
    .map((item, index) => {
      const row = item as Partial<QuickAccessLink>;

      return {
        label: String(row.label || "").trim(),
        href: String(row.href || "").trim(),
        order: Number(row.order || index + 1),
        enabled: row.enabled !== false,
      };
    })
    .filter((item) => item.label && item.href)
    .sort((a, b) => a.order - b.order);
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsForm>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSettings() {
    try {
      setLoading(true);
      setMessage("");

      const snapshot = await getDoc(doc(db, "siteSettings", "main"));

      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<SettingsForm>;

        setForm({
          ...defaultSettings,
          ...data,
          quickAccessLinks: normalizeQuickAccessLinks(data.quickAccessLinks),
        });
      } else {
        setForm(defaultSettings);
      }
    } catch (error) {
      console.error(error);
      setMessage(
        "Settings could not be loaded. If this shows missing permissions, allow authenticated admin access to siteSettings/main in Firebase rules."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function updateField<K extends keyof SettingsForm>(field: K, value: SettingsForm[K]) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function updateQuickAccess(index: number, field: keyof QuickAccessLink, value: string | number | boolean) {
    setForm((previous) => ({
      ...previous,
      quickAccessLinks: previous.quickAccessLinks.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function addQuickAccessLink() {
    setForm((previous) => ({
      ...previous,
      quickAccessLinks: [
        ...previous.quickAccessLinks,
        {
          label: "",
          href: "",
          order: previous.quickAccessLinks.length + 1,
          enabled: true,
        },
      ],
    }));
  }

  function removeQuickAccessLink(index: number) {
    setForm((previous) => ({
      ...previous,
      quickAccessLinks: previous.quickAccessLinks.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.siteName.trim()) {
      alert("Website name is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const quickAccessLinks = form.quickAccessLinks
        .map((item, index) => ({
          label: item.label.trim(),
          href: item.href.trim(),
          order: Number(item.order || index + 1),
          enabled: item.enabled !== false,
        }))
        .filter((item) => item.label && item.href)
        .sort((a, b) => a.order - b.order);

      await setDoc(
        doc(db, "siteSettings", "main"),
        {
          ...form,
          siteName: form.siteName.trim(),
          tagline: form.tagline.trim(),
          siteUrl: form.siteUrl.trim(),
          logoUrl: form.logoUrl.trim(),
          faviconUrl: form.faviconUrl.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          whatsapp: form.whatsapp.trim(),
          youtube: form.youtube.trim(),
          instagram: form.instagram.trim(),
          facebook: form.facebook.trim(),
          telegram: form.telegram.trim(),
          defaultSeoTitle: form.defaultSeoTitle.trim(),
          defaultSeoDescription: form.defaultSeoDescription.trim(),
          defaultKeywords: form.defaultKeywords.trim(),
          defaultShareImageUrl: form.defaultShareImageUrl.trim(),
          topImportantTiles: Number(form.topImportantTiles || 8),
          latestPostsCount: Number(form.latestPostsCount || 10),
          quickAccessLinks,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setForm((previous) => ({ ...previous, quickAccessLinks }));
      setMessage("Settings saved successfully. Public pages are not connected to these values yet, so existing UI is unchanged.");
    } catch (error) {
      console.error(error);
      setMessage(
        "Failed to save settings. If Firebase says missing permissions, allow authenticated admin access to siteSettings/main."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "22px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 6px", color: "#111827" }}>Settings</h1>
            <p style={{ margin: 0, color: "#64748b" }}>
              Admin-controlled settings saved safely. Public pages will keep their
              current design until we connect these controls in later phases.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving || loading}
            style={{
              border: "1px solid #2563eb",
              borderRadius: "10px",
              background: saving || loading ? "#94a3b8" : "#2563eb",
              color: "#ffffff",
              padding: "10px 14px",
              fontWeight: 900,
              cursor: saving || loading ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {message ? (
          <section
            style={{
              background: message.includes("successfully") ? "#ecfdf5" : "#fff7ed",
              border: message.includes("successfully") ? "1px solid #bbf7d0" : "1px solid #fed7aa",
              borderRadius: "14px",
              padding: "14px",
              color: message.includes("successfully") ? "#166534" : "#9a3412",
              fontWeight: 700,
              lineHeight: 1.5,
            }}
          >
            {message}
          </section>
        ) : null}

        <section style={cardStyle}>
          <h2 style={{ margin: "0 0 14px", color: "#0f172a", fontSize: "20px" }}>
            Website Info
          </h2>
          <div style={gridStyle}>
            <label>
              <span style={labelStyle}>Website Name</span>
              <input style={inputStyle} value={form.siteName} onChange={(event) => updateField("siteName", event.target.value)} />
            </label>
            <label>
              <span style={labelStyle}>Tagline</span>
              <input style={inputStyle} value={form.tagline} onChange={(event) => updateField("tagline", event.target.value)} />
            </label>
            <label>
              <span style={labelStyle}>Website URL</span>
              <input style={inputStyle} value={form.siteUrl} onChange={(event) => updateField("siteUrl", event.target.value)} />
            </label>
            <label>
              <span style={labelStyle}>Logo URL</span>
              <input style={inputStyle} value={form.logoUrl} onChange={(event) => updateField("logoUrl", event.target.value)} placeholder="Optional" />
            </label>
            <label>
              <span style={labelStyle}>Favicon URL</span>
              <input style={inputStyle} value={form.faviconUrl} onChange={(event) => updateField("faviconUrl", event.target.value)} placeholder="Optional" />
            </label>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ margin: "0 0 14px", color: "#0f172a", fontSize: "20px" }}>
            Contact & Social Links
          </h2>
          <div style={gridStyle}>
            <label>
              <span style={labelStyle}>Email</span>
              <input style={inputStyle} value={form.email} onChange={(event) => updateField("email", event.target.value)} />
            </label>
            <label>
              <span style={labelStyle}>Phone / WhatsApp</span>
              <input style={inputStyle} value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              <span style={labelStyle}>Address</span>
              <input style={inputStyle} value={form.address} onChange={(event) => updateField("address", event.target.value)} />
            </label>
            <label>
              <span style={labelStyle}>WhatsApp Channel</span>
              <input style={inputStyle} value={form.whatsapp} onChange={(event) => updateField("whatsapp", event.target.value)} />
            </label>
            <label>
              <span style={labelStyle}>YouTube</span>
              <input style={inputStyle} value={form.youtube} onChange={(event) => updateField("youtube", event.target.value)} />
            </label>
            <label>
              <span style={labelStyle}>Instagram</span>
              <input style={inputStyle} value={form.instagram} onChange={(event) => updateField("instagram", event.target.value)} />
            </label>
            <label>
              <span style={labelStyle}>Facebook</span>
              <input style={inputStyle} value={form.facebook} onChange={(event) => updateField("facebook", event.target.value)} />
            </label>
            <label>
              <span style={labelStyle}>Telegram</span>
              <input style={inputStyle} value={form.telegram} onChange={(event) => updateField("telegram", event.target.value)} />
            </label>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ margin: "0 0 14px", color: "#0f172a", fontSize: "20px" }}>
            Homepage Controls
          </h2>
          <div style={gridStyle}>
            <label>
              <span style={labelStyle}>Top Important Tiles</span>
              <input type="number" min={1} max={8} style={inputStyle} value={form.topImportantTiles} onChange={(event) => updateField("topImportantTiles", Number(event.target.value))} />
            </label>
            <label>
              <span style={labelStyle}>Latest Posts Count</span>
              <input type="number" min={1} max={20} style={inputStyle} value={form.latestPostsCount} onChange={(event) => updateField("latestPostsCount", Number(event.target.value))} />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 800, color: "#374151" }}>
              <input type="checkbox" checked={form.showImportantInformation} onChange={(event) => updateField("showImportantInformation", event.target.checked)} />
              Show Important Information section later
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 800, color: "#374151" }}>
              <input type="checkbox" checked={form.showLastDateReminder} onChange={(event) => updateField("showLastDateReminder", event.target.checked)} />
              Show Last Date Reminder later
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 800, color: "#374151" }}>
              <input type="checkbox" checked={form.showLatestSchemes} onChange={(event) => updateField("showLatestSchemes", event.target.checked)} />
              Show Latest Schemes panel later
            </label>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ margin: "0 0 14px", color: "#0f172a", fontSize: "20px" }}>
            SEO & Sharing Defaults
          </h2>
          <div style={gridStyle}>
            <label>
              <span style={labelStyle}>Default SEO Title</span>
              <input style={inputStyle} value={form.defaultSeoTitle} onChange={(event) => updateField("defaultSeoTitle", event.target.value)} />
            </label>
            <label>
              <span style={labelStyle}>Default Share Image URL</span>
              <input style={inputStyle} value={form.defaultShareImageUrl} onChange={(event) => updateField("defaultShareImageUrl", event.target.value)} />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              <span style={labelStyle}>Default Description</span>
              <textarea style={{ ...inputStyle, minHeight: "90px" }} value={form.defaultSeoDescription} onChange={(event) => updateField("defaultSeoDescription", event.target.value)} />
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              <span style={labelStyle}>Default Keywords</span>
              <input style={inputStyle} value={form.defaultKeywords} onChange={(event) => updateField("defaultKeywords", event.target.value)} />
            </label>
          </div>
        </section>

        <section style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "14px",
            }}
          >
            <div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: "20px" }}>
                Quick Access Links
              </h2>
              <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
                Prepared for future right-side Quick Access panels. Current public UI is unchanged.
              </p>
            </div>
            <button
              type="button"
              onClick={addQuickAccessLink}
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                background: "#ffffff",
                padding: "9px 12px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              + Add Link
            </button>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            {form.quickAccessLinks.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1.6fr 90px 90px auto",
                  gap: "10px",
                  alignItems: "center",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              >
                <input style={inputStyle} value={item.label} onChange={(event) => updateQuickAccess(index, "label", event.target.value)} placeholder="Label" />
                <input style={inputStyle} value={item.href} onChange={(event) => updateQuickAccess(index, "href", event.target.value)} placeholder="/jobs" />
                <input type="number" style={inputStyle} value={item.order} onChange={(event) => updateQuickAccess(index, "order", Number(event.target.value))} />
                <label style={{ display: "flex", gap: "8px", alignItems: "center", fontWeight: 800, color: "#374151" }}>
                  <input type="checkbox" checked={item.enabled} onChange={(event) => updateQuickAccess(index, "enabled", event.target.checked)} />
                  Show
                </label>
                <button
                  type="button"
                  onClick={() => removeQuickAccessLink(index)}
                  style={{
                    border: "1px solid #fecaca",
                    borderRadius: "10px",
                    background: "#fff1f2",
                    color: "#be123c",
                    padding: "9px 12px",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        <section
          style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: "16px",
            padding: "18px",
          }}
        >
          <h2 style={{ margin: "0 0 8px", color: "#9a3412", fontSize: "20px" }}>
            Safe coding note
          </h2>
          <p style={{ margin: 0, color: "#7c2d12", lineHeight: 1.65 }}>
            These values are saved in a separate settings document. Public pages
            are intentionally not connected in this phase, so existing frontend
            UI, SEO tags, footer, search and category behavior remain untouched.
          </p>
        </section>
      </form>
    </AdminLayout>
  );
}
