"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import PostDynamicTables from "@/components/admin/PostDynamicTables";
import JobMediaEditor from "@/components/forms/JobMediaEditor";
import JobCommonDetailsEditor from "@/components/forms/JobCommonDetailsEditor";
import JobPostDetailsEditor from "@/components/forms/JobPostDetailsEditor";
import FlexibleDetailsEditor from "@/components/admin/FlexibleDetailsEditor";
import {
  FlexibleDataTable,
  FlexibleDetailSection,
  cleanFlexibleDataTables,
  cleanFlexibleDetailSections,
  normalizeFlexibleDataTables,
  normalizeFlexibleDetailSections,
} from "@/lib/flexibleDetails";
import {
  JobFeeRow,
  JobInfoPanel,
  RequiredDocumentRow,
  cleanJobDocuments,
  cleanJobFeeRows,
  cleanJobInfoPanels,
  createDefaultJobDocuments,
  createJobInfoPanel,
  normalizeJobDocuments,
  normalizeJobFeeRows,
  normalizeJobInfoPanels,
} from "@/lib/jobDetails";
import { normalizeCompatiblePostLinks } from "@/lib/postLinkCompatibility";
import {
  ImportantDateRow,
  ImportantLinkRow,
  cleanImportantDates,
  cleanImportantLinks,
  createEmptyDateRow,
  createEmptyLinkRow,
} from "@/lib/postOptions";

import {
  getActiveAdminSubCategories,
  mergeSubCategoryNames,
} from "@/lib/adminSubCategories";

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

const STATUS_OPTIONS = ["published"] as const;

type EditJobFormProps = {
  id?: string;
  postId?: string;
};

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

function normalizeDateRows(value: any): ImportantDateRow[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [createEmptyDateRow()];
  }

  return value.map((item: any, index: number) => ({
    id: item?.id || `date_${index}_${Date.now()}`,
    type: item?.type || item?.label || "Custom",
    label: item?.label || item?.type || "",
    value: item?.value || "",
  }));
}

function normalizeLinkRows(data: any): ImportantLinkRow[] {
  const rows = normalizeCompatiblePostLinks(data).map((item, index) => ({
    id: item.id || `link_${index}_${Date.now()}`,
    type: item.type || item.label || "Custom",
    label: item.label || item.type || "Official Link",
    url: item.url || "",
  }));

  return rows.length > 0 ? rows : [createEmptyLinkRow()];
}

export function EditJobForm({ id, postId }: EditJobFormProps) {
  const router = useRouter();
  const params = useParams();

  const routeId =
    id ||
    postId ||
    (typeof params?.id === "string" ? params.id : "") ||
    (typeof params?.postId === "string" ? params.postId : "");

  const [title, setTitle] = useState("");
  const [manualSlug, setManualSlug] = useState("");

  const [shortDescription, setShortDescription] = useState("");
  const [notificationNumber, setNotificationNumber] = useState("");
  const [description, setDescription] = useState("");
  const [syllabus, setSyllabus] = useState("");
  const [examPattern, setExamPattern] = useState("");
  const [selectionProcedure, setSelectionProcedure] = useState("");
  const [detailSections, setDetailSections] = useState<FlexibleDetailSection[]>([]);
  const [dataTables, setDataTables] = useState<FlexibleDataTable[]>([]);

  const [jobInfoPanels, setJobInfoPanels] = useState<JobInfoPanel[]>([
    createJobInfoPanel(),
  ]);
  const [feeStructureRows, setFeeStructureRows] = useState<JobFeeRow[]>([]);
  const [documentsRequired, setDocumentsRequired] = useState<
    RequiredDocumentRow[]
  >(createDefaultJobDocuments());

  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
const [youtubeUrl2, setYoutubeUrl2] = useState("");
const [youtubeUrl3, setYoutubeUrl3] = useState("");

  const [shareTitle, setShareTitle] = useState("");
  const [shareDescription, setShareDescription] = useState("");

  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>(JOB_SUB_CATEGORIES);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [status, setStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>("published");

  const [importantDates, setImportantDates] = useState<ImportantDateRow[]>([
    createEmptyDateRow(),
  ]);
  const [importantLinks, setImportantLinks] = useState<ImportantLinkRow[]>([
    createEmptyLinkRow(),
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const autoSlug = useMemo(() => makeSlug(title), [title]);
  const finalSlug = manualSlug.trim() ? makeSlug(manualSlug) : autoSlug;

  useEffect(() => {
    let isMounted = true;

    async function loadManagedSubCategories() {
      try {
        const managed = await getActiveAdminSubCategories("jobs");
        if (isMounted) {
          setSubCategoryOptions(mergeSubCategoryNames(JOB_SUB_CATEGORIES, managed));
        }
      } catch (error) {
        console.warn("Could not load managed job subcategories.", error);
      }
    }

    loadManagedSubCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  function toggleSubCategory(value: string) {
    setSubCategories((oldItems) =>
      oldItems.includes(value)
        ? oldItems.filter((item) => item !== value)
        : [...oldItems, value]
    );
  }

  useEffect(() => {
    const loadJob = async () => {
      if (!routeId) {
        alert("Job ID not found");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const ref = doc(db, "posts", routeId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          alert("Job not found");
          setLoading(false);
          return;
        }

        const data = snap.data();

        setTitle(data.title || "");
        setManualSlug(data.slug || "");

        setShortDescription(data.shortDescription || data.excerpt || "");
        setNotificationNumber(data.notificationNumber || data.notificationNo || "");
        setDescription(data.description || data.content || "");
        setSyllabus(data.syllabus || "");
        setExamPattern(data.examPattern || "");
        setSelectionProcedure(data.selectionProcedure || "");
        setDetailSections(
          normalizeFlexibleDetailSections(
            data.contentSections || data.detailSections
          )
        );
        setDataTables(
          normalizeFlexibleDataTables(data.dataTables || data.customTables)
        );

        setJobInfoPanels(normalizeJobInfoPanels(data));
        setFeeStructureRows(normalizeJobFeeRows(data));
        setDocumentsRequired(normalizeJobDocuments(data));

        setPreviewImageUrl(
          data.previewImageUrl ||
            data.imageUrl ||
            data.bannerImageUrl ||
            data.bannerUrl ||
            data.shareImage ||
            (Array.isArray(data.imageUrls) ? data.imageUrls[0] : "") ||
            ""
        );
        setYoutubeUrl(data.youtubeUrl || "");

const savedYoutubeUrls = Array.isArray(data.youtubeUrls)
  ? data.youtubeUrls
  : [];

setYoutubeUrl2(savedYoutubeUrls[0] || data.youtubeUrl2 || data.videoUrl2 || "");
setYoutubeUrl3(savedYoutubeUrls[1] || data.youtubeUrl3 || data.videoUrl3 || "");

        setShareTitle(data.shareTitle || "");
        setShareDescription(data.shareDescription || "");

        if (Array.isArray(data.subCategories)) {
          setSubCategories(data.subCategories);
        } else if (data.subCategory) {
          setSubCategories([data.subCategory]);
        } else {
          setSubCategories([]);
        }

        setStatus("published");

        setImportantDates(normalizeDateRows(data.importantDates));
        setImportantLinks(normalizeLinkRows(data));
      } catch (error) {
        console.error(error);
        alert("Failed to load job");
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [routeId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!routeId) {
      alert("Job ID not found");
      return;
    }

    if (!title.trim()) {
      alert("Please enter job title");
      return;
    }

    if (!finalSlug) {
      alert("Please enter a valid slug or title");
      return;
    }

    if (subCategories.length === 0) {
      alert("Please select at least one job subcategory");
      return;
    }

    try {
      setSaving(true);

      const cleanedPanels = cleanJobInfoPanels(jobInfoPanels);
      const cleanedFeeRows = cleanJobFeeRows(feeStructureRows);
      const cleanedDocuments = cleanJobDocuments(documentsRequired);
      const cleanedDetailSections = cleanFlexibleDetailSections(detailSections);
      const cleanedDataTables = cleanFlexibleDataTables(dataTables);

      const firstPanel = cleanedPanels[0];
      const resolvedImageUrl = previewImageUrl.trim();

      const cleanedDates = cleanImportantDates(importantDates);
const cleanedLinks = cleanImportantLinks(importantLinks);
const excerpt = makeExcerpt(shortDescription, description);

const cleanedYoutubeUrls = [youtubeUrl2, youtubeUrl3]
  .map((item) => item.trim())
  .filter(Boolean);

      await updateDoc(doc(db, "posts", routeId), {
        title: title.trim(),
        slug: finalSlug,
        category: "jobs",
        subCategories: [...subCategories],

        excerpt,
        content: description.trim(),

        shortDescription: shortDescription.trim(),
        notificationNumber: notificationNumber.trim(),
        description: description.trim(),
        syllabus: syllabus.trim(),
        examPattern: examPattern.trim(),
        selectionProcedure: selectionProcedure.trim(),
        contentSections: cleanedDetailSections,
        detailSections: cleanedDetailSections,
        dataTables: cleanedDataTables,
        customTables: cleanedDataTables,

        jobInfoPanels: cleanedPanels,
        feeStructureRows: cleanedFeeRows,
        applicationFeeRows: cleanedFeeRows,
        documentsRequired: cleanedDocuments,
        requiredDocuments: cleanedDocuments,

        organization: firstPanel?.organization || "",
        department: firstPanel?.organization || "",
        postName: firstPanel?.postName || "",
        totalVacancy: firstPanel?.totalVacancy || "",
        applicationMode: firstPanel?.applicationMode || "",
        modeOfApplication: firstPanel?.applicationMode || "",
        qualification: firstPanel?.qualification || "",
        ageLimit: firstPanel?.ageLimit || "",
        salary: firstPanel?.salary || "",
        payScale: firstPanel?.salary || "",

        previewImageUrl: resolvedImageUrl,
        imageUrl: resolvedImageUrl,
        bannerImageUrl: resolvedImageUrl,

        youtubeUrl: youtubeUrl.trim(),
youtubeUrls: cleanedYoutubeUrls,

        shareTitle: shareTitle.trim(),
        shareDescription: shareDescription.trim(),
        shareImage: resolvedImageUrl,

        importantDates: cleanedDates,
        importantLinks: cleanedLinks,
        links: cleanedLinks,
        sourceUrl: cleanedLinks[0]?.url || "",

        tags: subCategories,
        status,

        updatedAt: serverTimestamp(),
      });

      alert("Job updated successfully");
      router.push("/admin/jobs");
    } catch (error) {
      console.error(error);
      alert("Failed to update job");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Loading job...</p>;
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

          <label style={labelStyle}>
            Notification Number
            <input
              type="text"
              placeholder="Example: OSSC-1234/2026"
              value={notificationNumber}
              onChange={(e) => setNotificationNumber(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>
      </section>

      <section style={sectionStyle}>
        <h3 style={sectionTitleStyle}>Job Subcategories *</h3>

        <div style={checkboxGridStyle}>
          {subCategoryOptions.map((item) => (
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

      <JobPostDetailsEditor
        panels={jobInfoPanels}
        onChange={setJobInfoPanels}
      />

      <JobCommonDetailsEditor
        feeRows={feeStructureRows}
        documents={documentsRequired}
        postNames={jobInfoPanels
          .map((panel) => panel.postName.trim())
          .filter(Boolean)}
        onFeeRowsChange={setFeeStructureRows}
        onDocumentsChange={setDocumentsRequired}
      />

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
            Full Description
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

      <details style={sectionStyle}>
        <summary style={compactSummaryStyle}>
          Optional Exam Pattern, Syllabus and Selection Procedure
        </summary>

        <div style={{ display: "grid", gap: "14px", marginTop: "14px" }}>
          <label style={labelStyle}>
            Exam Pattern
            <textarea
              placeholder="Add exam pattern details only when available."
              value={examPattern}
              onChange={(e) => setExamPattern(e.target.value)}
              rows={5}
              style={textareaStyle}
            />
          </label>

          <label style={labelStyle}>
            Syllabus
            <textarea
              placeholder="Add syllabus details only when available."
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
              rows={5}
              style={textareaStyle}
            />
          </label>

          <label style={labelStyle}>
            Selection Procedure
            <textarea
              placeholder="Add selection stages only when available."
              value={selectionProcedure}
              onChange={(e) => setSelectionProcedure(e.target.value)}
              rows={5}
              style={textareaStyle}
            />
          </label>
        </div>
      </details>

      <FlexibleDetailsEditor
        detailSections={detailSections}
        dataTables={dataTables}
        onDetailSectionsChange={setDetailSections}
        onDataTablesChange={setDataTables}
        sectionLabel="Optional Job Details and Data Tables"
      />

      <JobMediaEditor
        imageUrl={previewImageUrl}
        youtubeUrl={youtubeUrl}
        youtubeUrl2={youtubeUrl2}
        youtubeUrl3={youtubeUrl3}
        onImageUrlChange={setPreviewImageUrl}
        onUploadingChange={setImageUploading}
        onYoutubeUrlChange={(index, value) => {
          if (index === 0) setYoutubeUrl(value);
          if (index === 1) setYoutubeUrl2(value);
          if (index === 2) setYoutubeUrl3(value);
        }}
      />

      <PostDynamicTables
        importantDates={importantDates}
        importantLinks={importantLinks}
        onDatesChange={setImportantDates}
        onLinksChange={setImportantLinks}
      />

      <details style={sectionStyle}>
        <summary style={compactSummaryStyle}>Social Sharing Preview</summary>

        <div style={{ ...gridStyle, marginTop: "14px" }}>
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
      </details>

      <button
        type="submit"
        disabled={saving || imageUploading}
        style={submitButtonStyle}
      >
        {imageUploading
          ? "Wait for image upload..."
          : saving
          ? "Updating..."
          : "Update Job"}
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

const compactSummaryStyle: CSSProperties = {
  color: "#111827",
  fontSize: "16px",
  fontWeight: 900,
  cursor: "pointer",
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

export default EditJobForm;
