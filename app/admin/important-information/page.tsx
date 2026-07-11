"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminPostShareButtons from "@/components/admin/AdminPostShareButtons";
import {
  createImportantInformationPost,
  deleteImportantInformationPost,
  getImportantInformationPosts,
  getFirstImportantInfoYouTubeThumbnail,
  isImportantInfoSlugAvailable,
  makeImportantInfoSlug,
  normalizeStringList,
  updateImportantInformationPost,
  type ImportantInfoPost,
  type ImportantInfoRow,
  type ImportantInfoSection,
} from "@/lib/importantInformation";

type ImportantInfoFormState = {
  title: string;
  slug: string;
  shortDescription: string;
  details: string;
  detailSections: ImportantInfoSection[];
  imageUrlsText: string;
  youtubeUrl: string;
  youtubeUrlsText: string;
  referenceKeywordsText: string;
  quickInfoRows: ImportantInfoRow[];
  shareTitle: string;
  shareDescription: string;
  shareImageUrl: string;
  isFeatured: boolean;
  featuredOrder: string;
  status: string;
};

const emptyForm: ImportantInfoFormState = {
  title: "",
  slug: "",
  shortDescription: "",
  details: "",
  detailSections: [{ title: "Details", content: "" }],
  imageUrlsText: "",
  youtubeUrl: "",
  youtubeUrlsText: "",
  referenceKeywordsText: "",
  quickInfoRows: [{ label: "", value: "" }],
  shareTitle: "",
  shareDescription: "",
  shareImageUrl: "",
  isFeatured: false,
  featuredOrder: "0",
  status: "published",
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "18px",
};

const fieldStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "6px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  background: "#ffffff",
};

const smallButtonStyle = {
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  background: "#ffffff",
  padding: "9px 12px",
  fontWeight: 800,
  cursor: "pointer",
};

function toFormState(post: ImportantInfoPost): ImportantInfoFormState {
  return {
    title: post.title || "",
    slug: post.slug || "",
    shortDescription: post.shortDescription || "",
    details: post.details || "",
    detailSections:
      post.detailSections && post.detailSections.length > 0
        ? post.detailSections
        : [{ title: "Details", content: "" }],
    imageUrlsText: (post.imageUrls || []).join("\n"),
    youtubeUrl: post.youtubeUrl || "",
    youtubeUrlsText: (post.youtubeUrls || []).join("\n"),
    referenceKeywordsText: (post.referenceKeywords || []).join(", "),
    quickInfoRows:
      post.quickInfoRows && post.quickInfoRows.length > 0
        ? post.quickInfoRows
        : [{ label: "", value: "" }],
    shareTitle: post.shareTitle || "",
    shareDescription: post.shareDescription || "",
    shareImageUrl: post.shareImageUrl || "",
    isFeatured: Boolean(post.isFeatured),
    featuredOrder: String(post.featuredOrder || 0),
    status: post.status || "published",
  };
}

function preparePayload(form: ImportantInfoFormState): ImportantInfoPost {
  const imageUrls = normalizeStringList(form.imageUrlsText);
  const youtubeUrls = normalizeStringList(form.youtubeUrlsText);
  const referenceKeywords = normalizeStringList(form.referenceKeywordsText);

  const detailSections = form.detailSections
    .map((item) => ({
      title: item.title.trim(),
      content: item.content.trim(),
    }))
    .filter((item) => item.title || item.content);

  const quickInfoRows = form.quickInfoRows
    .map((item) => ({
      label: item.label.trim(),
      value: item.value.trim(),
    }))
    .filter((item) => item.label || item.value);

  const slug = form.slug.trim() || makeImportantInfoSlug(form.title);
  const shareImageUrl =
    form.shareImageUrl.trim() ||
    imageUrls[0] ||
    getFirstImportantInfoYouTubeThumbnail({
      youtubeUrl: form.youtubeUrl,
      youtubeUrls,
    }) ||
    "";

  return {
    title: form.title.trim(),
    slug,
    shortDescription: form.shortDescription.trim(),
    details: form.details.trim(),
    detailSections,
    imageUrls,
    youtubeUrl: form.youtubeUrl.trim(),
    youtubeUrls,
    referenceKeywords,
    quickInfoRows,
    shareTitle: form.shareTitle.trim(),
    shareDescription: form.shareDescription.trim(),
    shareImageUrl,
    isFeatured: form.isFeatured,
    featuredOrder: Number(form.featuredOrder || 0),
    status: form.status,
  };
}

function getTimeValue(post: ImportantInfoPost) {
  return post.createdAt?.seconds || 0;
}

export default function AdminImportantInformationPage() {
  const [posts, setPosts] = useState<ImportantInfoPost[]>([]);
  const [form, setForm] = useState<ImportantInfoFormState>(emptyForm);
  const [editingPost, setEditingPost] = useState<ImportantInfoPost | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const featuredCount = useMemo(
    () => posts.filter((post) => post.isFeatured && post.status !== "hidden").length,
    [posts]
  );

  async function loadPosts() {
    try {
      setLoading(true);
      const data = await getImportantInformationPosts();
      setPosts(data.sort((a, b) => getTimeValue(b) - getTimeValue(a)));
    } catch (error) {
      console.error(error);
      alert("Failed to load important information posts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  function updateField(field: keyof ImportantInfoFormState, value: string | boolean) {
    setForm((oldValue) => ({ ...oldValue, [field]: value }));
  }

  function updateSection(index: number, field: keyof ImportantInfoSection, value: string) {
    setForm((oldValue) => ({
      ...oldValue,
      detailSections: oldValue.detailSections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: value } : section
      ),
    }));
  }

  function updateQuickInfoRow(index: number, field: keyof ImportantInfoRow, value: string) {
    setForm((oldValue) => ({
      ...oldValue,
      quickInfoRows: oldValue.quickInfoRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      ),
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingPost(null);
    setShowForm(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter title.");
      return;
    }

    if (!form.shortDescription.trim()) {
      alert("Please enter short description.");
      return;
    }

    if (!form.details.trim() && form.detailSections.every((item) => !item.content.trim())) {
      alert("Please enter details.");
      return;
    }

    try {
      setSaving(true);

      const basePayload = preparePayload(form);
      const slug = basePayload.slug;

      const slugAvailable = await isImportantInfoSlugAvailable(slug, editingPost?.id);

      if (!slugAvailable) {
        alert("This slug is already used. Please change the slug or title.");
        return;
      }

      const payload: ImportantInfoPost = {
        ...basePayload,
      };

      if (editingPost?.id) {
        await updateImportantInformationPost(editingPost.id, payload);
        alert("Important information updated successfully.");
      } else {
        await createImportantInformationPost(payload);
        alert("Important information saved successfully.");
      }

      resetForm();
      await loadPosts();
    } catch (error) {
      console.error(error);
      alert("Failed to save important information. Check Firebase permission and Storage rules if image upload failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(post: ImportantInfoPost) {
    if (!post.id) return;

    const confirmDelete = window.confirm(`Delete this important information?\n\n${post.title}`);

    if (!confirmDelete) return;

    try {
      await deleteImportantInformationPost(post.id);
      await loadPosts();
      alert("Important information deleted successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to delete important information.");
    }
  }



  return (
    <AdminLayout>
      <div style={{ display: "grid", gap: "22px" }}>
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
            <h1 style={{ margin: "0 0 6px" }}>Important Information</h1>
            <p style={{ margin: 0, color: "#64748b" }}>
              Manage homepage 8 important tiles and full information detail pages.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (showForm && !editingPost) {
                resetForm();
              } else {
                setEditingPost(null);
                setForm(emptyForm);
                            setShowForm(true);
              }
            }}
            style={{
              ...smallButtonStyle,
              background: showForm && !editingPost ? "#f3f4f6" : "#2563eb",
              color: showForm && !editingPost ? "#111827" : "#ffffff",
              borderColor: showForm && !editingPost ? "#d1d5db" : "#2563eb",
            }}
          >
            {showForm && !editingPost ? "Hide Form" : "+ Create Information"}
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
          }}
        >
          <div style={cardStyle}>
            <strong style={{ display: "block", fontSize: "24px", color: "#0f172a" }}>
              {posts.length}
            </strong>
            <span style={{ color: "#64748b", fontWeight: 800 }}>Total information posts</span>
          </div>
          <div style={cardStyle}>
            <strong style={{ display: "block", fontSize: "24px", color: "#0f172a" }}>
              {featuredCount}/8
            </strong>
            <span style={{ color: "#64748b", fontWeight: 800 }}>Featured homepage tiles</span>
          </div>
        </div>

        {showForm || editingPost ? (
          <form onSubmit={handleSubmit} style={{ ...cardStyle, display: "grid", gap: "18px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0 }}>
                {editingPost ? "Edit Important Information" : "Create Important Information"}
              </h2>
              <button type="button" onClick={resetForm} style={smallButtonStyle}>
                Close Form
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
              <div>
                <label>Title</label>
                <input
                  value={form.title}
                  onChange={(event) => {
                    const title = event.target.value;
                    setForm((oldValue) => ({
                      ...oldValue,
                      title,
                      slug: oldValue.slug || makeImportantInfoSlug(title),
                    }));
                  }}
                  placeholder="Example: +2 Admission Important Information"
                  style={fieldStyle}
                />
              </div>

              <div>
                <label>Slug</label>
                <input
                  value={form.slug}
                  onChange={(event) => updateField("slug", makeImportantInfoSlug(event.target.value))}
                  placeholder="plus-two-admission-important-information"
                  style={fieldStyle}
                />
              </div>
            </div>

            <div>
              <label>Short Description</label>
              <textarea
                value={form.shortDescription}
                onChange={(event) => updateField("shortDescription", event.target.value)}
                placeholder="Short information shown in tiles and sharing preview"
                rows={3}
                style={fieldStyle}
              />
            </div>

            <div>
              <label>Main Details</label>
              <textarea
                value={form.details}
                onChange={(event) => updateField("details", event.target.value)}
                placeholder="Write full details here"
                rows={6}
                style={fieldStyle}
              />
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <h3 style={{ margin: 0 }}>Details Stacks</h3>
                <button
                  type="button"
                  style={smallButtonStyle}
                  onClick={() =>
                    setForm((oldValue) => ({
                      ...oldValue,
                      detailSections: [...oldValue.detailSections, { title: "", content: "" }],
                    }))
                  }
                >
                  + Add Stack
                </button>
              </div>

              {form.detailSections.map((section, index) => (
                <div key={index} style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "12px", display: "grid", gap: "10px" }}>
                  <input
                    value={section.title}
                    onChange={(event) => updateSection(index, "title", event.target.value)}
                    placeholder="Stack title"
                    style={fieldStyle}
                  />
                  <textarea
                    value={section.content}
                    onChange={(event) => updateSection(index, "content", event.target.value)}
                    placeholder="Stack content"
                    rows={4}
                    style={fieldStyle}
                  />
                  {form.detailSections.length > 1 ? (
                    <button
                      type="button"
                      style={{ ...smallButtonStyle, color: "#dc2626", width: "fit-content" }}
                      onClick={() =>
                        setForm((oldValue) => ({
                          ...oldValue,
                          detailSections: oldValue.detailSections.filter((_, sectionIndex) => sectionIndex !== index),
                        }))
                      }
                    >
                      Remove Stack
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            <div>
              <label>Image URLs (Optional)</label>
              <textarea
                value={form.imageUrlsText}
                onChange={(event) => updateField("imageUrlsText", event.target.value)}
                placeholder="One image URL per line. If empty, the page will use YouTube thumbnail first, otherwise a default Odisha Sathi preview image."
                rows={4}
                style={fieldStyle}
              />
              <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "13px" }}>
                Manual image upload is avoided here. Add an image URL only when you want a custom image.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
              <div>
                <label>Main YouTube Video Guide</label>
                <input
                  value={form.youtubeUrl}
                  onChange={(event) => updateField("youtubeUrl", event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  style={fieldStyle}
                />
              </div>

              <div>
                <label>Extra Video Links</label>
                <textarea
                  value={form.youtubeUrlsText}
                  onChange={(event) => updateField("youtubeUrlsText", event.target.value)}
                  placeholder="One YouTube URL per line"
                  rows={4}
                  style={fieldStyle}
                />
              </div>
            </div>

            <div>
              <label>Reference Keywords</label>
              <input
                value={form.referenceKeywordsText}
                onChange={(event) => updateField("referenceKeywordsText", event.target.value)}
                placeholder="Example: +2, SAMS, Admission, Intimation Letter"
                style={fieldStyle}
              />
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <h3 style={{ margin: 0 }}>Quick Panel Rows</h3>
                <button
                  type="button"
                  style={smallButtonStyle}
                  onClick={() =>
                    setForm((oldValue) => ({
                      ...oldValue,
                      quickInfoRows: [...oldValue.quickInfoRows, { label: "", value: "" }],
                    }))
                  }
                >
                  + Add Row
                </button>
              </div>

              {form.quickInfoRows.map((row, index) => (
                <div key={index} style={{ display: "grid", gridTemplateColumns: "minmax(160px, 0.5fr) 1fr auto", gap: "10px", alignItems: "center" }}>
                  <input
                    value={row.label}
                    onChange={(event) => updateQuickInfoRow(index, "label", event.target.value)}
                    placeholder="Label"
                    style={fieldStyle}
                  />
                  <input
                    value={row.value}
                    onChange={(event) => updateQuickInfoRow(index, "value", event.target.value)}
                    placeholder="Value"
                    style={fieldStyle}
                  />
                  <button
                    type="button"
                    style={{ ...smallButtonStyle, color: "#dc2626" }}
                    onClick={() =>
                      setForm((oldValue) => ({
                        ...oldValue,
                        quickInfoRows:
                          oldValue.quickInfoRows.length > 1
                            ? oldValue.quickInfoRows.filter((_, rowIndex) => rowIndex !== index)
                            : [{ label: "", value: "" }],
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div style={{ ...cardStyle, background: "#f8fafc" }}>
              <h3 style={{ marginTop: 0 }}>Share Preview / SEO Preview</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
                <div>
                  <label>Share Title</label>
                  <input value={form.shareTitle} onChange={(event) => updateField("shareTitle", event.target.value)} style={fieldStyle} />
                </div>
                <div>
                  <label>Share Image URL</label>
                  <input value={form.shareImageUrl} onChange={(event) => updateField("shareImageUrl", event.target.value)} style={fieldStyle} />
                </div>
              </div>
              <div style={{ marginTop: "12px" }}>
                <label>Share Description</label>
                <textarea value={form.shareDescription} onChange={(event) => updateField("shareDescription", event.target.value)} rows={3} style={fieldStyle} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 800 }}>
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) => updateField("isFeatured", event.target.checked)}
                />
                Show in top 8 homepage tiles
              </label>

              <div>
                <label>Featured Order</label>
                <input type="number" value={form.featuredOrder} onChange={(event) => updateField("featuredOrder", event.target.value)} style={fieldStyle} />
              </div>

              <div>
                <label>Status</label>
                <select value={form.status} onChange={(event) => updateField("status", event.target.value)} style={fieldStyle}>
                  <option value="published">Published</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                border: "none",
                borderRadius: "10px",
                background: "#2563eb",
                color: "#ffffff",
                padding: "13px 16px",
                fontWeight: 900,
                cursor: "pointer",
              }}
            >
              {saving ? "Saving..." : editingPost ? "Update Information" : "Save Information"}
            </button>
          </form>
        ) : null}

        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0 }}>Saved Important Information</h2>
              <p style={{ margin: "4px 0 0", color: "#64748b" }}>{posts.length} posts saved</p>
            </div>
            <button type="button" onClick={loadPosts} style={smallButtonStyle}>Refresh</button>
          </div>

          {loading ? (
            <p>Loading important information...</p>
          ) : posts.length === 0 ? (
            <p>No important information saved yet.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {posts.map((post) => (
                <div key={post.id} style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "14px", display: "grid", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div>
                      <h3 style={{ margin: "0 0 5px" }}>{post.title}</h3>
                      <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
                        {post.isFeatured ? `Featured tile order: ${post.featuredOrder || 0}` : "Bottom list only"} · {post.status || "published"}
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <Link href={`/important-information/${post.slug || post.id}`} target="_blank" style={{ ...smallButtonStyle, textDecoration: "none", color: "#16a34a" }}>
                        View
                      </Link>
                      <button
                        type="button"
                        style={smallButtonStyle}
                        onClick={() => {
                          setEditingPost(post);
                          setForm(toFormState(post));
                          setShowForm(false);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Edit
                      </button>
                      <button type="button" style={{ ...smallButtonStyle, color: "#dc2626" }} onClick={() => handleDelete(post)}>
                        Delete
                      </button>

                      <AdminPostShareButtons
                        title={post.title || "Odisha Sathi Important Information"}
                        publicPath={`/important-information/${post.slug || post.id}`}
                        description={post.shortDescription || ""}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
