import Link from "next/link";
import type { CSSProperties } from "react";
import {
  getCategoryLabel,
  getDefaultCategoryPreviewImage,
} from "@/lib/defaultImages";
import SocialShareButtons from "@/components/public/SocialShareButtons";
import YouTubePreviewCard from "@/components/public/YouTubePreviewCard";

export type ImportantDateRow = {
  id?: string;
  type?: string;
  label?: string;
  value?: string;
};

export type ImportantLinkRow = {
  id?: string;
  type?: string;
  label?: string;
  url?: string;
};

export type InfoRow = {
  label: string;
  value?: string;
};

export type InfoSection = {
  title: string;
  rows: InfoRow[];
};

export type CommonPostDetailData = {
  title: string;
  category?: string;
  subCategories?: string[];

  shortDescription?: string;
  description?: string;
  previewImageUrl?: string;

  shareTitle?: string;
  shareDescription?: string;
  postUrl?: string;

  youtubeUrl?: string;

  importantDates?: ImportantDateRow[];
  importantLinks?: ImportantLinkRow[];

  infoRows?: InfoRow[];
  infoSections?: InfoSection[];
};

type PostDetailLayoutProps = {
  post: CommonPostDetailData;
  backHref?: string;
};

function getDisplayLabel(type?: string, label?: string): string {
  if (label?.trim()) return label.trim();
  if (type?.trim()) return type.trim();
  return "Details";
}

function cleanDateRows(rows?: ImportantDateRow[]): ImportantDateRow[] {
  return (rows || []).filter((row) => {
    return row.value?.trim() || row.label?.trim() || row.type?.trim();
  });
}

function cleanLinkRows(rows?: ImportantLinkRow[]): ImportantLinkRow[] {
  return (rows || []).filter((row) => {
    return row.url?.trim();
  });
}

function cleanInfoRows(rows?: InfoRow[]): InfoRow[] {
  return (rows || []).filter((row) => row.value?.trim());
}

function cleanInfoSections(sections?: InfoSection[]): InfoSection[] {
  return (sections || [])
    .map((section) => ({
      ...section,
      rows: cleanInfoRows(section.rows),
    }))
    .filter((section) => section.rows.length > 0);
}

export default function PostDetailLayout({
  post,
  backHref = "/",
}: PostDetailLayoutProps) {
  const categoryLabel = getCategoryLabel(post.category);

  const previewImage =
  post.previewImageUrl?.trim() ||
  getDefaultCategoryPreviewImage(
    post.category,
    post.shortDescription || post.description || ""
  );

  const importantDates = cleanDateRows(post.importantDates);
  const importantLinks = cleanLinkRows(post.importantLinks);

  const infoSections = cleanInfoSections(post.infoSections);
  const fallbackInfoRows = cleanInfoRows(post.infoRows);

  const shareTitle = post.shareTitle?.trim() || post.title;

  const shareDescription =
    post.shareDescription?.trim() ||
    post.shortDescription?.trim() ||
    post.description?.trim() ||
    "";

  return (
    <main style={mainStyle}>
      <Link href={backHref} style={backLinkStyle}>
        ← Back
      </Link>

      <article style={articleStyle}>
        <div style={headerStyle}>
          <div style={categoryBadgeStyle}>{categoryLabel}</div>

          <h1 style={titleStyle}>{post.title}</h1>

          {post.subCategories && post.subCategories.length > 0 ? (
            <div style={chipRowStyle}>
              {post.subCategories.map((item) => (
                <span key={item} style={chipStyle}>
                  {item}
                </span>
              ))}
            </div>
          ) : null}

          {post.shortDescription ? (
            <p style={shortDescriptionStyle}>{post.shortDescription}</p>
          ) : null}
        </div>

        <div style={{ padding: "16px" }}>
          <div style={imageBoxStyle}>
            <img src={previewImage} alt={post.title} style={imageStyle} />
          </div>

          {infoSections.length > 0
            ? infoSections.map((section) => (
                <QuickInfoTable
                  key={section.title}
                  title={section.title}
                  rows={section.rows}
                />
              ))
            : fallbackInfoRows.length > 0
            ? (
              <QuickInfoTable
                title="Quick Information"
                rows={fallbackInfoRows}
              />
            )
            : null}

          <section style={sectionStyle}>
            <SectionHeader title="Description" />

            <div style={descriptionStyle}>
              {post.description?.trim() ? (
                post.description
              ) : (
                <span style={{ color: "#64748b" }}>
                  Details will be updated soon.
                </span>
              )}
            </div>
          </section>

          <section style={sectionStyle}>
            <SectionHeader title="Important Dates" />

            {importantDates.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <tbody>
                    {importantDates.map((row, index) => (
                      <tr
                        key={row.id || `${row.type}-${index}`}
                        style={{
                          borderBottom:
                            index === importantDates.length - 1
                              ? "none"
                              : "1px solid #e5e7eb",
                        }}
                      >
                        <td style={leftCellStyle}>
                          {getDisplayLabel(row.type, row.label)}
                        </td>
                        <td style={rightCellStyle}>{row.value || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={emptyTextStyle}>Important dates will be updated soon.</p>
            )}
          </section>

          <section style={sectionStyle}>
            <SectionHeader title="Important Links" />

            {importantLinks.length > 0 ? (
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <tbody>
                    {importantLinks.map((row, index) => (
                      <tr
                        key={row.id || `${row.type}-${index}`}
                        style={{
                          borderBottom:
                            index === importantLinks.length - 1
                              ? "none"
                              : "1px solid #e5e7eb",
                        }}
                      >
                        <td style={leftCellStyle}>
                          {getDisplayLabel(row.type, row.label)}
                        </td>

                        <td style={linkCellStyle}>
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={openLinkButtonStyle}
                          >
                            Open Link
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={emptyTextStyle}>Important links will be updated soon.</p>
            )}
          </section>

          <YouTubePreviewCard youtubeUrl={post.youtubeUrl} />

          <SocialShareButtons
            title={shareTitle}
            description={shareDescription}
            postUrl={post.postUrl}
          />
        </div>
      </article>
    </main>
  );
}

function QuickInfoTable({ title, rows }: { title: string; rows: InfoRow[] }) {
  const cleanRows = cleanInfoRows(rows);

  if (cleanRows.length === 0) {
    return null;
  }

  return (
    <section style={sectionStyle}>
      <SectionHeader title={title} />

      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <tbody>
            {cleanRows.map((row, index) => (
              <tr
                key={`${row.label}-${index}`}
                style={{
                  borderBottom:
                    index === cleanRows.length - 1
                      ? "none"
                      : "1px solid #e5e7eb",
                }}
              >
                <td style={leftCellStyle}>{row.label}</td>
                <td style={rightCellStyle}>{row.value || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={sectionHeaderInnerStyle}>
      <h2 style={sectionHeadingStyle}>{title}</h2>
    </div>
  );
}

const mainStyle: CSSProperties = {
  maxWidth: "980px",
  margin: "0 auto",
  padding: "18px 14px 36px",
};

const backLinkStyle: CSSProperties = {
  display: "inline-flex",
  marginBottom: "14px",
  color: "#2563eb",
  textDecoration: "none",
  fontWeight: 800,
};

const articleStyle: CSSProperties = {
  background: "#ffffff",
  borderRadius: "22px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 14px 38px rgba(15, 23, 42, 0.08)",
  overflow: "hidden",
};

const headerStyle: CSSProperties = {
  padding: "18px 18px 12px",
  borderBottom: "1px solid #eef2f7",
  background: "linear-gradient(180deg, #ffffff, #f8fafc)",
};

const categoryBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "30px",
  padding: "5px 12px",
  borderRadius: "999px",
  background: "#e0f2fe",
  color: "#075985",
  fontWeight: 800,
  fontSize: "13px",
  marginBottom: "10px",
};

const titleStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "clamp(26px, 4vw, 42px)",
  lineHeight: 1.15,
  fontWeight: 900,
  letterSpacing: "-0.03em",
};

const chipRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginTop: "14px",
};

const chipStyle: CSSProperties = {
  padding: "6px 10px",
  background: "#eff6ff",
  color: "#1d4ed8",
  borderRadius: "999px",
  fontSize: "13px",
  fontWeight: 800,
  border: "1px solid #bfdbfe",
};

const shortDescriptionStyle: CSSProperties = {
  margin: "12px 0 0",
  color: "#475569",
  fontSize: "16px",
  lineHeight: 1.6,
};

const imageBoxStyle: CSSProperties = {
  width: "100%",
  borderRadius: "18px",
  overflow: "hidden",
  border: "1px solid #e5e7eb",
  background: "#f1f5f9",
  marginBottom: "22px",
};

const imageStyle: CSSProperties = {
  width: "100%",
  aspectRatio: "1200 / 630",
  objectFit: "cover",
  display: "block",
};

const sectionStyle: CSSProperties = {
  marginTop: "22px",
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  background: "#ffffff",
  overflow: "hidden",
};

const sectionHeaderInnerStyle: CSSProperties = {
  padding: "13px 15px",
  background: "#f8fafc",
  borderBottom: "1px solid #e5e7eb",
};

const sectionHeadingStyle: CSSProperties = {
  margin: 0,
  fontSize: "18px",
  color: "#111827",
  fontWeight: 900,
};

const descriptionStyle: CSSProperties = {
  padding: "15px",
  color: "#334155",
  fontSize: "15px",
  lineHeight: 1.75,
  whiteSpace: "pre-line",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "15px",
};

const leftCellStyle: CSSProperties = {
  width: "45%",
  padding: "13px 15px",
  fontWeight: 800,
  color: "#0f172a",
  background: "#fdfdfd",
};

const rightCellStyle: CSSProperties = {
  padding: "13px 15px",
  color: "#334155",
  fontWeight: 600,
};

const linkCellStyle: CSSProperties = {
  padding: "13px 15px",
  textAlign: "right",
};

const openLinkButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "38px",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "#2563eb",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: "14px",
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  padding: "15px",
  color: "#64748b",
  fontSize: "15px",
};