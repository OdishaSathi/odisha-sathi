"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { buildAdminPostMetadata } from "@/lib/adminPostMetadata";
import { makeCanonicalSubCategorySlugs } from "@/lib/subCategoryIdentity";
import {
  getActiveAdminSubCategories,
  mergeSubCategoryNames,
} from "@/lib/adminSubCategories";
import type { AdmitCard } from "@/types/admitCard";
import ImageUploadField from "@/components/admin/ImageUploadField";
import CommonDocumentsEditor from "@/components/admin/CommonDocumentsEditor";
import FlexibleDetailsEditor from "@/components/admin/FlexibleDetailsEditor";
import {
  cleanFlexibleDataTables,
  cleanFlexibleDetailSections,
  normalizeFlexibleDataTables,
  normalizeFlexibleDetailSections,
  type FlexibleDataTable,
  type FlexibleDetailSection,
} from "@/lib/flexibleDetails";
import {
  cleanJobDocuments,
  normalizeJobDocuments,
  type RequiredDocumentRow,
} from "@/lib/jobDetails";

const ADMIT_CARD_SUB_CATEGORIES = [
  "Odisha Admit Cards & Exams",
  "Central Admit Cards & Exams",
  "Entrance Admit Cards & Exams",
  "Recruitment Admit Cards & Exams",
  "Board Admit Cards & Exams",
  "University Admit Cards & Exams",
  "School Admit Cards & Exams",
  "Exam City Intimation",
  "Hall Tickets",
  "Other Admit Cards & Exams",
];

type AdmitCardFormProps = {
  initialData?: AdmitCard | null;
  onSubmit: (data: AdmitCard) => void | Promise<void>;
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

export default function AdmitCardForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save Admit Card / Exam",
}: AdmitCardFormProps) {
  const [updateType, setUpdateType] = useState<"admit-card" | "exam">(
    "admit-card"
  );
  const [title, setTitle] = useState("");
  const [manualSlug, setManualSlug] = useState("");
  const [examName, setExamName] = useState("");
  const [organization, setOrganization] = useState("");
  const [admitCardDate, setAdmitCardDate] = useState("");
  const [admitCardDateDisplay, setAdmitCardDateDisplay] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examDateDisplay, setExamDateDisplay] = useState("");
  const [description, setDescription] = useState("");
  const [notificationNumber, setNotificationNumber] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [examMode, setExamMode] = useState("");
  const [downloadProcess, setDownloadProcess] = useState("");
  const [applicationProcess, setApplicationProcess] = useState("");
  const [documentsRequired, setDocumentsRequired] = useState<RequiredDocumentRow[]>([]);
  const [detailSections, setDetailSections] = useState<FlexibleDetailSection[]>([]);
  const [dataTables, setDataTables] = useState<FlexibleDataTable[]>([]);
  const [extraLinks, setExtraLinks] = useState<Array<{ label: string; url: string }>>([]);
  const [downloadLink, setDownloadLink] = useState("");
  const [notificationLink, setNotificationLink] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeUrl2, setYoutubeUrl2] = useState("");
  const [youtubeUrl3, setYoutubeUrl3] = useState("");
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [subCategoryOptions, setSubCategoryOptions] =
    useState<string[]>(ADMIT_CARD_SUB_CATEGORIES);
  const [status, setStatus] = useState("published");
  const [saving, setSaving] = useState(false);

  const autoSlug = useMemo(() => makeSlug(title), [title]);
  const finalSlug = manualSlug.trim() ? makeSlug(manualSlug) : autoSlug;

  useEffect(() => {
    const data: any = initialData || {};
    const savedYoutubeUrls = Array.isArray(data.youtubeUrls)
      ? data.youtubeUrls
      : [];

    setUpdateType(data.updateType === "exam" ? "exam" : "admit-card");
    setTitle(data.title || "");
    setManualSlug(data.slug || "");
    setExamName(data.examName || "");
    setOrganization(data.organization || data.department || "");
    setAdmitCardDate(data.admitCardDate || "");
    setAdmitCardDateDisplay(data.admitCardDateDisplay || "");
    setExamDate(data.examDate || "");
    setExamDateDisplay(data.examDateDisplay || "");
    setDescription(data.description || data.content || "");
    setNotificationNumber(data.notificationNumber || data.notificationNo || "");
    setPreviewImageUrl(data.previewImageUrl || data.imageUrl || data.sharingImageUrl || "");
    setExamMode(data.examMode || "");
    setDownloadProcess(data.downloadProcess || "");
    setApplicationProcess(data.applicationProcess || "");
    setDocumentsRequired(normalizeJobDocuments(data));
    setDetailSections(normalizeFlexibleDetailSections(data.contentSections || data.detailSections));
    setDataTables(normalizeFlexibleDataTables(data.dataTables || data.customTables));
    setExtraLinks(Array.isArray(data.extraLinks) ? data.extraLinks : []);
    setDownloadLink(
      data.downloadLink ||
        data.admitCardLink ||
        findLink(data, [/download/i, /admit/i, /hall/i])
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

  useEffect(() => {
    let active = true;

    getActiveAdminSubCategories("admit-cards")
      .then((managedOptions) => {
        if (active) {
          setSubCategoryOptions(
            mergeSubCategoryNames(ADMIT_CARD_SUB_CATEGORIES, managedOptions)
          );
        }
      })
      .catch((error) => {
        console.warn(
          "Managed Admit Card & Exam subcategories could not be loaded",
          error
        );
      });

    return () => {
      active = false;
    };
  }, []);

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
      alert("Please enter admit card or exam title");
      return;
    }

    if (!finalSlug) {
      alert("Please enter a valid title or slug");
      return;
    }

    if (!description.trim()) {
      alert("Please enter admit card or exam details");
      return;
    }

    if (subCategories.length === 0) {
      alert("Please select at least one subcategory");
      return;
    }

    const importantDates = [
      {
        label: "Admit Card Date",
        value: admitCardDateDisplay.trim() || admitCardDate,
      },
      {
        label: "Exam Date",
        value: examDateDisplay.trim() || examDate,
      },
    ].filter((item) => item.value);

    const importantLinks = [
      {
        label: updateType === "exam" ? "Exam Notice" : "Download Admit Card",
        url: downloadLink.trim(),
      },
      { label: "Official Notification", url: notificationLink.trim() },
      ...extraLinks.map((item) => ({
        label: item.label.trim(),
        url: item.url.trim(),
      })),
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
        category: "admit-cards",
        type: "admit-cards",
        updateType,
        examName: examName.trim(),
        organization: organization.trim(),
        admitCardDate,
        admitCardDateDisplay: admitCardDateDisplay.trim(),
        examDate,
        examDateDisplay: examDateDisplay.trim(),
        description: description.trim(),
        content: description.trim(),
        notificationNumber: notificationNumber.trim(),
        previewImageUrl: previewImageUrl.trim(),
        imageUrl: previewImageUrl.trim(),
        examMode: examMode.trim(),
        downloadProcess: downloadProcess.trim(),
        applicationProcess: applicationProcess.trim(),
        documentsRequired: cleanJobDocuments(documentsRequired),
        contentSections: cleanFlexibleDetailSections(detailSections),
        detailSections: cleanFlexibleDetailSections(detailSections),
        dataTables: cleanFlexibleDataTables(dataTables),
        customTables: cleanFlexibleDataTables(dataTables),
        downloadLink: downloadLink.trim(),
        admitCardLink: downloadLink.trim(),
        notificationLink: notificationLink.trim(),
        extraLinks: extraLinks
          .map((item) => ({ label: item.label.trim(), url: item.url.trim() }))
          .filter((item) => item.label && item.url),
        sourceUrl: downloadLink.trim() || notificationLink.trim(),
        youtubeUrl: youtubeUrl.trim(),
        youtubeUrls,
        subCategories: [...subCategories],
        subCategorySlugs: makeCanonicalSubCategorySlugs(subCategories),
        status,
        published: true,
        importantDates,
        importantLinks,
        links: importantLinks,
        ...buildAdminPostMetadata({ importantDates, importantLinks }),
      } as AdmitCard);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-compact-form" onSubmit={handleSubmit} style={formStyle}>
      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Basic Information</h3>

        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Update Type</label>
            <select
              value={updateType}
              onChange={(e) =>
                setUpdateType(e.target.value === "exam" ? "exam" : "admit-card")
              }
              style={inputStyle}
            >
              <option value="admit-card">Admit Card</option>
              <option value="exam">Exam</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              placeholder="Example: OSSSC Admit Card 2026"
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
              placeholder="Example: CRE II / CHSL / Entrance Exam"
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
            <label style={labelStyle}>Notification / Reference Number</label>
            <input
              type="text"
              placeholder="Optional notification number"
              value={notificationNumber}
              onChange={(e) => setNotificationNumber(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Exam Mode</label>
            <input
              type="text"
              placeholder="Online / Offline / CBT"
              value={examMode}
              onChange={(e) => setExamMode(e.target.value)}
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
            <label style={labelStyle}>Admit Card Date</label>
            <input
              type="date"
              value={admitCardDate}
              onChange={(e) => setAdmitCardDate(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Optional display: Released / Coming Soon"
              value={admitCardDateDisplay}
              onChange={(e) => setAdmitCardDateDisplay(e.target.value)}
              style={{ ...inputStyle, marginTop: "8px" }}
            />
          </div>

          <div>
            <label style={labelStyle}>Exam Date</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Optional display: July 2026 / To be announced"
              value={examDateDisplay}
              onChange={(e) => setExamDateDisplay(e.target.value)}
              style={{ ...inputStyle, marginTop: "8px" }}
            />
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Details</h3>

        <label style={labelStyle}>Description</label>
        <textarea
          placeholder="Enter full admit card or exam details"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          style={textareaStyle}
        />

        <div style={{ ...gridStyle, marginTop: "16px" }}>
          <div>
            <label style={labelStyle}>Download / Check Process</label>
            <textarea
              placeholder="Optional step-by-step process"
              value={downloadProcess}
              onChange={(e) => setDownloadProcess(e.target.value)}
              rows={5}
              style={textareaStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Application / Exam Process</label>
            <textarea
              placeholder="Optional application or exam process"
              value={applicationProcess}
              onChange={(e) => setApplicationProcess(e.target.value)}
              rows={5}
              style={textareaStyle}
            />
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Important Links</h3>

        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>
              {updateType === "exam" ? "Exam Notice Link" : "Download Link"}
            </label>
            <input
              type="url"
              placeholder="https://example.gov.in/admit-card"
              value={downloadLink}
              onChange={(e) => setDownloadLink(e.target.value)}
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

        <div style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
          {extraLinks.map((item, index) => (
            <div key={index} style={gridStyle}>
              <input
                type="text"
                aria-label={`Additional link ${index + 1} label`}
                placeholder="Link label"
                value={item.label}
                onChange={(e) => setExtraLinks((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, label: e.target.value } : row))}
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  inputMode="url"
                  aria-label={`Additional link ${index + 1} URL`}
                  placeholder="https://..."
                  value={item.url}
                  onChange={(e) => setExtraLinks((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, url: e.target.value } : row))}
                  style={inputStyle}
                />
                <button type="button" style={cancelButtonStyle} onClick={() => setExtraLinks((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}>Remove</button>
              </div>
            </div>
          ))}
          <button type="button" style={{ ...cancelButtonStyle, width: "fit-content" }} onClick={() => setExtraLinks((rows) => [...rows, { label: "", url: "" }])}>
            + Add Another Link
          </button>
        </div>
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Media</h3>

        <ImageUploadField
          label="Preview / Sharing Image URL"
          value={previewImageUrl}
          onChange={setPreviewImageUrl}
        />

        <div style={{ ...gridStyle, marginTop: "16px" }}>
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

      <CommonDocumentsEditor
        documents={documentsRequired}
        onChange={setDocumentsRequired}
        title="Documents Required (Optional)"
      />

      <FlexibleDetailsEditor
        detailSections={detailSections}
        dataTables={dataTables}
        onDetailSectionsChange={setDetailSections}
        onDataTablesChange={setDataTables}
        sectionLabel="Additional Exam / Admit Card Details and Data Tables"
      />

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Subcategories</h3>

        <div style={checkboxGridStyle}>
          {subCategoryOptions.map((item) => (
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
