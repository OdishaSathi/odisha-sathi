"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { buildAdminPostMetadata } from "@/lib/adminPostMetadata";
import type { ResultPost } from "@/types/result";

const RESULT_SUB_CATEGORIES = [
  "Board Results",
  "University Results",
  "Entrance Results",
  "Recruitment Results",
  "Scholarship Results",
  "Answer Key",
  "Merit List",
];

type ResultFormProps = {
  initialData?: ResultPost | null;
  onSubmit: (data: ResultPost) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
};

function makeSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function findLink(data: any, patterns: RegExp[]) {
  const links = [
    ...(Array.isArray(data?.importantLinks) ? data.importantLinks : []),
    ...(Array.isArray(data?.links) ? data.links : []),
  ];

  const matched = links.find((item) =>
    patterns.some((pattern) =>
      pattern.test(String(item?.label || item?.type || ""))
    )
  );

  return matched?.url || "";
}

const formStyle: CSSProperties = {
  display: "grid",
  gap: "22px",
};

const cardStyle: CSSProperties = {
  background: "#ffffff",
  padding: "20px",
  borderRadius: "14px",
  border: "1px solid #e5e7eb",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  lineHeight: 1.55,
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "14px",
  fontWeight: 600,
  color: "#374151",
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 14px",
  fontSize: "17px",
  fontWeight: 700,
  color: "#111827",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
};

const checkboxGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const checkboxStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  color: "#111827",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

const submitButtonStyle: CSSProperties = {
  padding: "12px 16px",
  border: "none",
  borderRadius: "8px",
  background: "#2563eb",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 700,
  cursor: "pointer",
};

const cancelButtonStyle: CSSProperties = {
  ...submitButtonStyle,
  background: "#f3f4f6",
  color: "#111827",
};

export default function ResultForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save Result",
}: ResultFormProps) {
  const [title, setTitle] = useState("");
  const [manualSlug, setManualSlug] = useState("");
  const [examName, setExamName] = useState("");
  const [organization, setOrganization] = useState("");
  const [resultDate, setResultDate] = useState("");
  const [resultDateDisplay, setResultDateDisplay] = useState("");
  const [description, setDescription] = useState("");
  const [resultLink, setResultLink] = useState("");
  const [notificationLink, setNotificationLink] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeUrl2, setYoutubeUrl2] = useState("");
  const [youtubeUrl3, setYoutubeUrl3] = useState("");
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [status, setStatus] = useState("published");
  const [saving, setSaving] = useState(false);

  const autoSlug = useMemo(() => makeSlug(title), [title]);
  const finalSlug = manualSlug.trim() ? makeSlug(manualSlug) : autoSlug;

  useEffect(() => {
    const data: any = initialData || {};
    const savedYoutubeUrls = Array.isArray(data.youtubeUrls)
      ? data.youtubeUrls
      : [];

    setTitle(data.title || "");
    setManualSlug(data.slug || "");
    setExamName(data.examName || "");
    setOrganization(data.organization || data.department || "");
    setResultDate(data.resultDate || "");
    setResultDateDisplay(data.resultDateDisplay || "");
    setDescription(data.description || data.content || "");
    setResultLink(
      data.resultLink ||
        data.resultUrl ||
        findLink(data, [/result/i, /check/i, /download/i])
    );
    setNotificationLink(
      data.notificationLink ||
        data.officialNotificationLink ||
        findLink(data, [/notification/i, /official/i])
    );
    setYoutubeUrl(data.youtubeUrl || "");
    setYoutubeUrl2(savedYoutubeUrls[0] || data.youtubeUrl2 || "");
    setYoutubeUrl3(savedYoutubeUrls[1] || data.youtubeUrl3 || "");
    setSubCategories(
      Array.isArray(data.subCategories)
        ? data.subCategories
        : data.subCategory
        ? [data.subCategory]
        : []
    );
    setStatus(data.status || "published");
  }, [initialData]);

  function toggleSubCategory(value: string) {
    setSubCategories((oldItems) =>
      oldItems.includes(value)
        ? oldItems.filter((item) => item !== value)
        : [...oldItems, value]
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      alert("Please enter result title");
      return;
    }

    if (!finalSlug) {
      alert("Please enter a valid title or slug");
      return;
    }

    if (!description.trim()) {
      alert("Please enter result details");
      return;
    }

    if (subCategories.length === 0) {
      alert("Please select at least one result subcategory");
      return;
    }

    const importantDates = [
      {
        label: "Result Date",
        value: resultDateDisplay.trim() || resultDate,
      },
    ].filter((item) => item.value);

    const importantLinks = [
      { label: "Check Result", url: resultLink.trim() },
      { label: "Official Notification", url: notificationLink.trim() },
    ].filter((item) => item.url);

    const youtubeUrls = [youtubeUrl2, youtubeUrl3]
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      setSaving(true);

      await onSubmit({
        ...(initialData || {}),
        title: title.trim(),
        slug: finalSlug,
        category: "results",
        type: "results",
        examName: examName.trim(),
        organization: organization.trim(),
        resultDate,
        resultDateDisplay: resultDateDisplay.trim(),
        description: description.trim(),
        content: description.trim(),
        resultLink: resultLink.trim(),
        notificationLink: notificationLink.trim(),
        youtubeUrl: youtubeUrl.trim(),
        youtubeUrls,
        subCategories: [...subCategories],
        status,
        published: true,
        importantDates,
        importantLinks,
        links: importantLinks,
        ...buildAdminPostMetadata({ importantDates, importantLinks }),
      } as ResultPost);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Basic Information</h3>

        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Result Title</label>
            <input
              type="text"
              placeholder="Example: OSSSC CRE II Result 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Slug</label>
            <input
              type="text"
              placeholder={autoSlug || "auto-generated-from-title"}
              value={manualSlug}
              onChange={(e) => setManualSlug(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Exam Name</label>
            <input
              type="text"
              placeholder="Example: CHSL / CRE II / Board Exam"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Organization / Board</label>
            <input
              type="text"
              placeholder="Example: OSSSC"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={inputStyle}
            >
              <option value="published">Published</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Important Dates</h3>

        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Result Date</label>
            <input
              type="date"
              value={resultDate}
              onChange={(e) => setResultDate(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Optional display: July 2026 / Declared"
              value={resultDateDisplay}
              onChange={(e) => setResultDateDisplay(e.target.value)}
              style={{ ...inputStyle, marginTop: "8px" }}
            />
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Result Details</h3>

        <label style={labelStyle}>Description</label>
        <textarea
          placeholder="Enter full result details"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          style={textareaStyle}
        />
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Important Links</h3>

        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Result Link</label>
            <input
              type="url"
              placeholder="https://example.gov.in/result"
              value={resultLink}
              onChange={(e) => setResultLink(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Official Notification Link</label>
            <input
              type="url"
              placeholder="https://example.gov.in/notification.pdf"
              value={notificationLink}
              onChange={(e) => setNotificationLink(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Media</h3>

        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>YouTube Video 1</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>YouTube Video 2</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl2}
              onChange={(e) => setYoutubeUrl2(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>YouTube Video 3</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl3}
              onChange={(e) => setYoutubeUrl3(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Result Subcategories</h3>

        <div style={checkboxGridStyle}>
          {RESULT_SUB_CATEGORIES.map((item) => (
            <label
              key={item}
              style={{
                ...checkboxStyle,
                border: subCategories.includes(item)
                  ? "1px solid #2563eb"
                  : checkboxStyle.border,
                background: subCategories.includes(item)
                  ? "#eff6ff"
                  : "#ffffff",
              }}
            >
              <input
                type="checkbox"
                checked={subCategories.includes(item)}
                onChange={() => toggleSubCategory(item)}
              />
              {item}
            </label>
          ))}
        </div>
      </section>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button type="submit" disabled={saving} style={submitButtonStyle}>
          {saving ? "Saving..." : submitLabel}
        </button>

        {onCancel ? (
          <button type="button" onClick={onCancel} style={cancelButtonStyle}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
