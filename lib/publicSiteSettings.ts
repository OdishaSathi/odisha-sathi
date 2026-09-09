import { siteConfig } from "@/lib/siteConfig";

export type PublicQuickAccessLink = {
  label: string;
  href: string;
  order: number;
  enabled: boolean;
};

export type PublicSiteSettings = {
  siteName: string;
  tagline: string;
  siteUrl: string;
  logoUrl: string;
  faviconUrl: string;
  email: string;
  phone: string;
  address: string;
  whatsapp: string;
  telegram: string;
  youtube: string;
  facebook: string;
  instagram: string;
  showImportantInformation: boolean;
  latestPostsCount: number;
  showLastDateReminder: boolean;
  showLatestCitizenServices: boolean;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  defaultKeywords: string;
  defaultShareImageUrl: string;
  quickAccessLinks: PublicQuickAccessLink[];
};

const fallbackQuickAccessLinks: PublicQuickAccessLink[] = [
  { label: "Latest Jobs", href: "/jobs", order: 1, enabled: true },
  { label: "Admissions", href: "/admissions", order: 2, enabled: true },
  { label: "Admit Cards & Exams", href: "/admit-cards", order: 3, enabled: true },
  { label: "Results", href: "/results", order: 4, enabled: true },
  { label: "Citizen Services", href: "/citizen-services", order: 5, enabled: true },
];

export const fallbackPublicSiteSettings: PublicSiteSettings = {
  siteName: siteConfig.siteName,
  tagline: siteConfig.tagline,
  siteUrl: siteConfig.siteUrl,
  logoUrl: "",
  faviconUrl: "",
  email: siteConfig.contact.email,
  phone: "",
  address: siteConfig.contact.address || "Odisha",
  whatsapp: siteConfig.socialLinks.whatsapp,
  telegram: siteConfig.socialLinks.telegram,
  youtube: siteConfig.socialLinks.youtube,
  facebook: siteConfig.socialLinks.facebook,
  instagram: siteConfig.socialLinks.instagram,
  showImportantInformation: true,
  latestPostsCount: 12,
  showLastDateReminder: true,
  showLatestCitizenServices: true,
  defaultSeoTitle: "Odisha Sathi – Odisha Jobs, Exams, Results, Admissions & Citizen Services",
  defaultSeoDescription:
    "Odisha Sathi provides latest Odisha jobs, exams, results, admissions, important information and citizen services.",
  defaultKeywords:
    "Odisha jobs, Odisha exams, Odisha results, Odisha admissions, Odisha scholarships, Odisha citizen services, Odisha Sathi",
  defaultShareImageUrl: "",
  quickAccessLinks: fallbackQuickAccessLinks,
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function positiveInt(value: unknown, fallback: number, min = 1, max = 50) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function normalizeQuickAccessLinks(value: unknown): PublicQuickAccessLink[] {
  if (!Array.isArray(value)) return fallbackQuickAccessLinks;

  const links = value
    .map((item, index) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      return {
        label: text(row.label),
        href: text(row.href),
        order: positiveInt(row.order, index + 1, 1, 999),
        enabled: row.enabled !== false,
      };
    })
    .filter((item) => item.label && item.href)
    .sort((a, b) => a.order - b.order);

  return links.length ? links : fallbackQuickAccessLinks;
}

export function normalizePublicSiteSettings(data: Record<string, unknown> | null | undefined): PublicSiteSettings {
  const source = data || {};

  return {
    siteName: text(source.siteName) || fallbackPublicSiteSettings.siteName,
    tagline: text(source.tagline) || fallbackPublicSiteSettings.tagline,
    siteUrl: text(source.siteUrl) || fallbackPublicSiteSettings.siteUrl,
    logoUrl: text(source.logoUrl),
    faviconUrl: text(source.faviconUrl),
    email: text(source.email) || fallbackPublicSiteSettings.email,
    phone: text(source.phone),
    address: text(source.address) || fallbackPublicSiteSettings.address,
    whatsapp: text(source.whatsapp) || fallbackPublicSiteSettings.whatsapp,
    telegram: text(source.telegram) || fallbackPublicSiteSettings.telegram,
    youtube: text(source.youtube) || fallbackPublicSiteSettings.youtube,
    facebook: text(source.facebook) || fallbackPublicSiteSettings.facebook,
    instagram: text(source.instagram) || fallbackPublicSiteSettings.instagram,
    showImportantInformation: source.showImportantInformation !== false,
    latestPostsCount: positiveInt(source.latestPostsCount, fallbackPublicSiteSettings.latestPostsCount, 1, 20),
    showLastDateReminder: source.showLastDateReminder !== false,
    showLatestCitizenServices: source.showLatestCitizenServices !== false,
    defaultSeoTitle: text(source.defaultSeoTitle) || fallbackPublicSiteSettings.defaultSeoTitle,
    defaultSeoDescription:
      text(source.defaultSeoDescription) || fallbackPublicSiteSettings.defaultSeoDescription,
    defaultKeywords: text(source.defaultKeywords) || fallbackPublicSiteSettings.defaultKeywords,
    defaultShareImageUrl: text(source.defaultShareImageUrl),
    quickAccessLinks: normalizeQuickAccessLinks(source.quickAccessLinks),
  };
}
