"use client";

import { FormEvent, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import PostDynamicTables from "@/components/admin/PostDynamicTables";
import {
  ImportantDateRow,
  ImportantLinkRow,
  cleanImportantDates,
  cleanImportantLinks,
  createEmptyDateRow,
  createEmptyLinkRow,
} from "@/lib/postOptions";

const JOB_SUB_CATEGORIES = [
  "Odisha Jobs",
  "Central Jobs",
  "Apprenticeship",
  "10th Jobs",
  "ITI Jobs",
  "Diploma Jobs",
  "+2 Jobs",
  "+3 Jobs",
  "Technical Graduate Jobs",
  "Post Graduate Jobs",
];

const STATUS_OPTIONS = ["published", "draft", "archived"] as const;

type JobInfoPanel = {
  id: string;
  organization: string;
  postName: string;
  totalVacancy: string;
  qualification: string;
  ageLimit: string;
  salary: string;
};

function createPanel(): JobInfoPanel {
  return {
    id: `panel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    organization: "",
    postName: "",
    totalVacancy: "",
    qualification: "",
    ageLimit: "",
    salary: "",
  };
}

function makeSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makeExcerpt(shortDescription: string, description: string) {
  const source = shortDescription.trim() || description.trim();
  if (source.length <= 160) return source;
  return `${source.slice(0, 157)}...`;
}

function isPanelFilled(panel: JobInfoPanel) {
  return (
    panel.organization.trim() ||
    panel.postName.trim() ||
    panel.totalVacancy.trim() ||
    panel.qualification.trim() ||
    panel.ageLimit.trim() ||
    panel.salary.trim()
  );
}

export function JobForm() {
  const [title, setTitle] = useState("");
  const [manualSlug, setManualSlug] = useState("");

  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");

  const [jobInfoPanels, setJobInfoPanels] = useState<JobInfoPanel[]>([
    createPanel(),
  ]);

  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");

  const [shareTitle, setShareTitle] = useState("");
  const [shareDescription, setShareDescription] = useState("");

  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [status, setStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>("published");

  const [importantDates, setImportantDates] = useState<ImportantDateRow[]>([
    createEmptyDateRow(),
  ]);
  const [importantLinks, setImportantLinks] = useState<ImportantLinkRow[]>([
    createEmptyLinkRow(),
  ]);

  const [saving, setSaving] = useState(false);

  const autoSlug = useMemo(() => makeSlug(title), [title]);
  const finalSlug = manualSlug.trim() ? makeSlug(manualSlug) : autoSlug;

  function toggleSubCategory(value: string) {
    setSubCategories((oldItems) =>
      oldItems.includes(value)
        ? oldItems.filter((item) => item !== value)
        : [...oldItems, value]
    );
  }

  function updatePanel(
    panelId: string,
    field: keyof Omit<JobInfoPanel, "id">,
    value: string
  ) {
    setJobInfoPanels((oldPanels) =>
      oldPanels.map((panel) =>
        panel.id === panelId ? { ...panel, [field]: value } : panel
      )
    );
  }

  function addPanel() {
    setJobInfoPanels((oldPanels) => [...oldPanels, createPanel()]);
  }

  function removePanel(panelId: string) {
    setJobInfoPanels((oldPanels) => {
      if (oldPanels.length === 1) return oldPanels;
      return oldPanels.filter((panel) => panel.id !== panelId);
    });
  }

  function resetForm() {
    setTitle("");
    setManualSlug("");
    setShortDescription("");
    setDescription("");
    setJobInfoPanels([createPanel()]);
    setPreviewImageUrl("");
    setYoutubeUrl("");
    setShareTitle("");
    setShareDescription("");
    setSubCategories([]);
    setStatus("published");
    setImportantDates([createEmptyDateRow()]);
    setImportantLinks([createEmptyLinkRow()]);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter job title");
      return;
    }

    if (!finalSlug) {
      alert("Please enter a valid slug or title");
      return;
    }

    if (!description.trim()) {
      alert("Please enter full job description");
      return;
    }

    if (subCategories.length === 0) {
      alert("Please select at least one job subcategory");
      return;
    }

    try {
      setSaving(true);

      const cleanedPanels = jobInfoPanels
        .filter(isPanelFilled)
        .map((panel) => ({
          id: panel.id,
          organization: panel.organization.trim(),
          postName: panel.postName.trim(),
          totalVacancy: panel.totalVacancy.trim(),
          qualification: panel.qualification.trim(),
          ageLimit: panel.ageLimit.trim(),
          salary: panel.salary.trim(),
        }));

      const firstPanel = cleanedPanels[0];

      const cleanedDates = cleanImportantDates(importantDates);
      const cleanedLinks = cleanImportantLinks(importantLinks);
      const excerpt = makeExcerpt(shortDescription, description);

      await addDoc(collection(db, "posts"), {
        title: title.trim(),
        slug: finalSlug,
        category: "jobs",
        subCategories: [...subCategories],

        excerpt,
        content: description.trim(),

        shortDescription: shortDescription.trim(),
        description: description.trim(),

        jobInfoPanels: cleanedPanels,

        organization: firstPanel?.organization || "",
        department: firstPanel?.organization || "",
        postName: firstPanel?.postName || "",
        totalVacancy: firstPanel?.totalVacancy || "",
        qualification: firstPanel?.qualification || "",
        ageLimit: firstPanel?.ageLimit || "",
        salary: firstPanel?.salary || "",
        payScale: firstPanel?.salary || "",

        previewImageUrl: previewImageUrl.trim(),
        imageUrl: previewImageUrl.trim(),

        youtubeUrl: youtubeUrl.trim(),

        shareTitle: shareTitle.trim(),
        shareDescription: shareDescription.trim(),
        shareImage: previewImageUrl.trim(),

        importantDates: cleanedDates,
        importantLinks: cleanedLinks,
        sourceUrl: cleanedLinks[0]?.url || "",

        tags: subCategories,
        status,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Job saved successfully");
      resetForm();
    } catch (error) {
      console.error(error);
      alert("Failed to save job");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "22px" }}>
      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Basic Job Details</h3>

        <div style={gridStyle}>
          <label style={labelStyle}>
            Job Title *
            <input
              type="text"
              placeholder="Example: OSSC Recruitment 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Slug
            <input
              type="text"
              placeholder={autoSlug || "auto-generated-from-title"}
              value={manualSlug}
              onChange={(e) => setManualSlug(e.target.value)}
              style={inputStyle}
            />
            <span style={helpTextStyle}>
              Final slug: {finalSlug || "Slug will be generated automatically"}
            </span>
          </label>

          <label style={labelStyle}>
            Status *
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])
              }
              style={inputStyle}
            >
              {STATUS_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Job Subcategories *</h3>

        <div style={checkboxGridStyle}>
          {JOB_SUB_CATEGORIES.map((item) => (
            <label
              key={item}
              style={{
                ...checkboxCardStyle,
                border: subCategories.includes(item)
                  ? "1px solid #2563eb"
                  : "1px solid #ddd",
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

      <section style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h3 style={sectionTitleStyle}>Quick Information Panels</h3>
            <p style={sectionTextStyle}>
              Add one panel for each different post under the same recruitment.
            </p>
          </div>

          <button type="button" onClick={addPanel} style={addButtonStyle}>
            + Add Another Post Panel
          </button>
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          {jobInfoPanels.map((panel, index) => (
            <div key={panel.id} style={panelCardStyle}>
              <div style={panelTopStyle}>
                <h4 style={{ margin: 0, color: "#0f172a" }}>
                  Quick Information - Post {index + 1}
                </h4>

                {jobInfoPanels.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removePanel(panel.id)}
                    style={removeButtonStyle}
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              <div style={gridStyle}>
                <label style={labelStyle}>
                  Organization / Department
                  <input
                    value={panel.organization}
                    onChange={(e) =>
                      updatePanel(panel.id, "organization", e.target.value)
                    }
                    placeholder="Example: OSSC"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Post Name
                  <input
                    value={panel.postName}
                    onChange={(e) =>
                      updatePanel(panel.id, "postName", e.target.value)
                    }
                    placeholder="Example: Junior Assistant"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Total Vacancy
                  <input
                    value={panel.totalVacancy}
                    onChange={(e) =>
                      updatePanel(panel.id, "totalVacancy", e.target.value)
                    }
                    placeholder="Example: 74 Posts"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Qualification
                  <input
                    value={panel.qualification}
                    onChange={(e) =>
                      updatePanel(panel.id, "qualification", e.target.value)
                    }
                    placeholder="Example: +3 / Degree"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Age Limit
                  <input
                    value={panel.ageLimit}
                    onChange={(e) =>
                      updatePanel(panel.id, "ageLimit", e.target.value)
                    }
                    placeholder="Example: 21 to 38 Years"
                    style={inputStyle}
                  />
                </label>

                <label style={labelStyle}>
                  Salary / Pay Scale
                  <input
                    value={panel.salary}
                    onChange={(e) =>
                      updatePanel(panel.id, "salary", e.target.value)
                    }
                    placeholder="Example: ₹19,900 - ₹63,200"
                    style={inputStyle}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Description</h3>

        <div style={{ display: "grid", gap: "14px" }}>
          <label style={labelStyle}>
            Short Description
            <textarea
              placeholder="Small summary for cards and sharing preview"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              rows={3}
              style={textareaStyle}
            />
          </label>

          <label style={labelStyle}>
            Full Description *
            <textarea
              placeholder="Enter full job details"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              style={textareaStyle}
            />
          </label>
        </div>
      </section>

      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Preview and YouTube</h3>

        <div style={gridStyle}>
          <label style={labelStyle}>
            Custom Preview Image URL
            <input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={previewImageUrl}
              onChange={(e) => setPreviewImageUrl(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            YouTube URL
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>
      </section>

      <PostDynamicTables
        importantDates={importantDates}
        importantLinks={importantLinks}
        onDatesChange={setImportantDates}
        onLinksChange={setImportantLinks}
      />

      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Social Sharing Preview</h3>

        <div style={gridStyle}>
          <label style={labelStyle}>
            Share Title
            <input
              type="text"
              placeholder="If blank, job title will be used"
              value={shareTitle}
              onChange={(e) => setShareTitle(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Share Description
            <textarea
              placeholder="If blank, short description will be used"
              value={shareDescription}
              onChange={(e) => setShareDescription(e.target.value)}
              rows={3}
              style={textareaStyle}
            />
          </label>
        </div>
      </section>

      <button type="submit" disabled={saving} style={submitButtonStyle}>
        {saving ? "Saving..." : "Save Job"}
      </button>
    </form>
  );
}

const sectionStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "18px",
  background: "#ffffff",
  padding: "16px",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "14px",
};

const sectionTitleStyle: CSSProperties = {
  margin: "0 0 12px",
  fontSize: "18px",
  fontWeight: 900,
  color: "#111827",
};

const sectionTextStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#64748b",
  fontSize: "14px",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const labelStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  fontSize: "13px",
  fontWeight: 800,
  color: "#334155",
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "42px",
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
  padding: "9px 11px",
  fontSize: "14px",
  color: "#0f172a",
  background: "#ffffff",
  outline: "none",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  lineHeight: 1.55,
};

const helpTextStyle: CSSProperties = {
  fontSize: "12px",
  color: "#64748b",
  fontWeight: 600,
};

const checkboxGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "10px",
};

const checkboxCardStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px",
  borderRadius: "10px",
  cursor: "pointer",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: "14px",
};

const panelCardStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  background: "#f8fafc",
  padding: "14px",
};

const panelTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "10px",
  alignItems: "center",
  marginBottom: "12px",
};

const addButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: "999px",
  background: "#2563eb",
  color: "#ffffff",
  padding: "9px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const removeButtonStyle: CSSProperties = {
  border: "1px solid #fecaca",
  borderRadius: "999px",
  background: "#fff1f2",
  color: "#be123c",
  padding: "7px 11px",
  fontWeight: 800,
  cursor: "pointer",
};

const submitButtonStyle: CSSProperties = {
  padding: "14px",
  border: "none",
  borderRadius: "12px",
  background: "#2563eb",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: "16px",
};

export default JobForm;