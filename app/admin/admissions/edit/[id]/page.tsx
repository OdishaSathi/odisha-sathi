"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import AdminLayout from "@/components/admin/AdminLayout";
import { db } from "@/lib/firebase";
import {
  getActiveAdminSubCategories,
  mergeSubCategoryOptions,
} from "@/lib/adminSubCategories";
import FlexibleDetailsEditor from "@/components/admin/FlexibleDetailsEditor";
import CommonDocumentsEditor from "@/components/admin/CommonDocumentsEditor";
import type { RequiredDocumentRow } from "@/lib/jobDetails";
import {
  cleanJobDocuments,
  normalizeJobDocuments,
} from "@/lib/jobDetails";
import {
  FlexibleDataTable,
  FlexibleDetailSection,
  cleanFlexibleDataTables,
  cleanFlexibleDetailSections,
  normalizeFlexibleDataTables,
  normalizeFlexibleDetailSections,
} from "@/lib/flexibleDetails";
import {
  confirmAdminValidation,
  validateAdminContent,
} from "@/lib/adminContentValidation";

const ADMISSION_BASE_CATEGORY_OPTIONS = [
  { label: "+2 Admission", value: "plus-two-admission" },
  { label: "+3 Admission", value: "plus-three-admission" },
  { label: "Diploma Admission", value: "diploma-admission" },
  { label: "ITI Admission", value: "iti-admission" },
  { label: "B.Ed / Teacher Training", value: "bed-teacher-training" },
];

const OTHER_ADMISSION_OPTION = { label: "Other Admissions", value: "other-admissions" };

const admissionCategoryOptions = [
  ...ADMISSION_BASE_CATEGORY_OPTIONS,
  OTHER_ADMISSION_OPTION,
];

type DateRow = {
  label: string;
  value: string;
};

type LinkRow = {
  label: string;
  url: string;
};

type AdmissionForm = {
  title: string;
  admissionCategory: string;
  subCategory: string;
  subCategories: string[];
  customAdmissionCategory: string;
  department: string;
  courseName: string;
  applicationStartDate: string;
  applicationStartDateDisplay: string;
  lastDate: string;
  lastDateDisplay: string;
  meritListDate: string;
  meritListDateDisplay: string;
  selectionDates: DateRow[];
  description: string;
  notificationNumber: string;
  eligibility: string;
  fees: string;
  applicationProcess: string;
  documentsRequired: RequiredDocumentRow[];
  contentSections: FlexibleDetailSection[];
  dataTables: FlexibleDataTable[];
  applicationLink: string;
  notificationLink: string;
  dateExtensionPdfLink: string;
  commonProspectusPdfLink: string;
  extraLinks: LinkRow[];
  youtubeUrl: string;
  youtubeUrls: string[];
  sharingImageUrl: string;
  status: "active" | "closed";
};

const emptyForm: AdmissionForm = {
  title: "",
  admissionCategory: "+2 Admission",
  subCategory: "plus-two-admission",
  subCategories: ["plus-two-admission"],
  customAdmissionCategory: "",
  department: "",
  courseName: "",
  applicationStartDate: "",
  applicationStartDateDisplay: "",
  lastDate: "",
  lastDateDisplay: "",
  meritListDate: "",
  meritListDateDisplay: "",
  selectionDates: [],
  description: "",
  notificationNumber: "",
  eligibility: "",
  fees: "",
  applicationProcess: "",
  documentsRequired: [],
  contentSections: [],
  dataTables: [],
  applicationLink: "",
  notificationLink: "",
  dateExtensionPdfLink: "",
  commonProspectusPdfLink: "",
  extraLinks: [],
  youtubeUrl: "",
  youtubeUrls: [],
  sharingImageUrl: "",
  status: "active",
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

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "14px",
  fontWeight: 600,
  color: "#374151",
};

const sectionTitleStyle: CSSProperties = {
  marginBottom: "14px",
  fontSize: "17px",
  fontWeight: 700,
  color: "#111827",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
};

function makeSlug(title: string) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return slug || `admission-${Date.now()}`;
}

function getSubCategoryFromLabel(label: string) {
  const found = admissionCategoryOptions.find((item) => item.label === label);
  return found?.value || "plus-two-admission";
}

function getLabelFromSubCategory(value: string) {
  const found = admissionCategoryOptions.find((item) => item.value === value);
  return found?.label || "+2 Admission";
}

function getDateDisplayValue(exactDate: string, displayText: string) {
  return displayText.trim() || exactDate;
}

function resolveAdmissionCategories(form: AdmissionForm) {
  const selected = admissionCategoryOptions.filter((item) =>
    form.subCategories.includes(item.value)
  );
  const resolved = selected.map((item) => ({ ...item }));

  if (
    form.subCategories.includes("other-admissions") &&
    form.customAdmissionCategory.trim()
  ) {
    const label = form.customAdmissionCategory.trim();
    const otherIndex = resolved.findIndex(
      (item) => item.value === "other-admissions"
    );
    const custom = { label, value: makeSlug(label) };
    if (otherIndex >= 0) resolved.splice(otherIndex, 1, custom);
    else resolved.push(custom);
  }

  return resolved.length > 0
    ? resolved
    : [{ label: form.admissionCategory, value: form.subCategory }];
}

function cleanDateRows(rows: DateRow[]) {
  return rows
    .map((row) => ({
      label: row.label.trim(),
      value: row.value,
    }))
    .filter((row) => row.label && row.value);
}

function cleanLinkRows(rows: LinkRow[]) {
  return rows
    .map((row) => ({
      label: row.label.trim(),
      url: row.url.trim(),
    }))
    .filter((row) => row.label && row.url);
}

function buildAdmissionPayload(form: AdmissionForm, oldSlug?: string) {
  const selectionDates = cleanDateRows(form.selectionDates);
  const extraLinks = cleanLinkRows(form.extraLinks);
  const resolvedCategories = resolveAdmissionCategories(form);
  const resolvedCategory = resolvedCategories[0];

  const importantDates = [
    {
      label: "Application Start Date",
      value: getDateDisplayValue(
        form.applicationStartDate,
        form.applicationStartDateDisplay
      ),
    },
    {
      label: "Last Date",
      value: getDateDisplayValue(form.lastDate, form.lastDateDisplay),
    },
    {
      label: "Selection / Merit List Date",
      value: getDateDisplayValue(form.meritListDate, form.meritListDateDisplay),
    },
    ...selectionDates,
  ].filter((item) => item.value);

  const importantLinks = [
    {
      label: "Apply Online",
      url: form.applicationLink.trim(),
    },
    {
      label: "Official Notification",
      url: form.notificationLink.trim(),
    },
    {
      label: "Date Extension Notice PDF",
      url: form.dateExtensionPdfLink.trim(),
    },
    {
      label: "Common Prospectus PDF",
      url: form.commonProspectusPdfLink.trim(),
    },
    ...extraLinks,
  ].filter((item) => item.url);

  return {
    title: form.title.trim(),
    slug: oldSlug || makeSlug(form.title),
    category: "admissions",
    type: "admissions",
    subCategory: resolvedCategory.value,
    subCategories: resolvedCategories.flatMap((item) => [
      item.label,
      item.value,
    ]),
    admissionCategory: resolvedCategory.label,
    admissionCategories: resolvedCategories.map((item) => item.label),
    categoryName: resolvedCategory.label,
    categorySlug: resolvedCategory.value,
    subCategorySlug: resolvedCategory.value,
    department: form.department.trim(),
    courseName: form.courseName.trim(),
    applicationStartDate: form.applicationStartDate,
    applicationStartDateDisplay: form.applicationStartDateDisplay.trim(),
    startDateDisplay: getDateDisplayValue(
      form.applicationStartDate,
      form.applicationStartDateDisplay
    ),
    lastDate: form.lastDate,
    lastDateDisplay: form.lastDateDisplay.trim(),
    meritListDate: form.meritListDate,
    meritListDateDisplay: form.meritListDateDisplay.trim(),
    selectionDates,
    description: form.description.trim(),
    content: form.description.trim(),
    notificationNumber: form.notificationNumber.trim(),
    eligibility: form.eligibility.trim(),
    fees: form.fees.trim(),
    applicationProcess: form.applicationProcess.trim(),
    howToApply: form.applicationProcess.trim(),
    documentsRequired: cleanJobDocuments(form.documentsRequired),
    contentSections: cleanFlexibleDetailSections(form.contentSections),
    detailSections: cleanFlexibleDetailSections(form.contentSections),
    dataTables: cleanFlexibleDataTables(form.dataTables),
    customTables: cleanFlexibleDataTables(form.dataTables),
    applicationLink: form.applicationLink.trim(),
    notificationLink: form.notificationLink.trim(),
    dateExtensionPdfLink: form.dateExtensionPdfLink.trim(),
    commonProspectusPdfLink: form.commonProspectusPdfLink.trim(),
    extraLinks,
    youtubeUrl: form.youtubeUrl.trim(),
    youtubeUrls: form.youtubeUrls.map((item) => item.trim()).filter(Boolean).slice(0, 2),
    sharingImageUrl: form.sharingImageUrl.trim(),
    previewImageUrl: form.sharingImageUrl.trim(),
    imageUrl: form.sharingImageUrl.trim(),
    status: form.status,
    published: true,
    importantDates,
    importantLinks,
    links: importantLinks,
    updatedAt: serverTimestamp(),
  };
}

export default function EditAdmissionPage() {
  const params = useParams();
  const router = useRouter();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [form, setForm] = useState<AdmissionForm>(emptyForm);
  const [admissionOptions, setAdmissionOptions] = useState(admissionCategoryOptions);
  const [oldSlug, setOldSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadManagedAdmissionCategories() {
      try {
        const managed = await getActiveAdminSubCategories("admissions");
        if (isMounted) {
          setAdmissionOptions(
            mergeSubCategoryOptions(
              ADMISSION_BASE_CATEGORY_OPTIONS,
              managed,
              [OTHER_ADMISSION_OPTION]
            )
          );
        }
      } catch (error) {
        console.warn("Could not load managed admission categories.", error);
      }
    }

    loadManagedAdmissionCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    async function fetchAdmission() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "posts", id);
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
          alert("Admission post not found.");
          router.push("/admin/admissions");
          return;
        }

        const data = snapshot.data();

        const savedAdmissionCategory = data.admissionCategory || "";
        const savedSubCategory =
          data.subCategory || getSubCategoryFromLabel(savedAdmissionCategory);
        const savedCategoryValues = admissionOptions
          .filter((option) =>
            (Array.isArray(data.subCategories)
              ? data.subCategories
              : [savedSubCategory]
            ).some(
              (item: string) =>
                item === option.value || item === option.label
            )
          )
          .map((option) => option.value);
        const isKnownCategory = admissionOptions.some(
          (item) => item.value === savedSubCategory
        );
        const finalSubCategory = isKnownCategory
          ? savedSubCategory
          : "other-admissions";
        const customAdmissionCategory =
          finalSubCategory === "other-admissions" &&
          savedAdmissionCategory !== "Other Admissions"
            ? savedAdmissionCategory || data.categoryName || ""
            : "";

        setOldSlug(data.slug || "");

        setForm({
          title: data.title || "",
          admissionCategory:
            finalSubCategory === "other-admissions" && customAdmissionCategory
              ? customAdmissionCategory
              : data.admissionCategory || admissionOptions.find((item) => item.value === finalSubCategory)?.label || getLabelFromSubCategory(finalSubCategory),
          subCategory: finalSubCategory,
          subCategories:
            savedCategoryValues.length > 0
              ? savedCategoryValues
              : [finalSubCategory],
          customAdmissionCategory,
          department: data.department || "",
          courseName: data.courseName || data.programmeName || "",
          applicationStartDate: data.applicationStartDate || "",
          applicationStartDateDisplay:
            data.applicationStartDateDisplay || data.startDateDisplay || "",
          lastDate: data.lastDate || "",
          lastDateDisplay: data.lastDateDisplay || "",
          meritListDate: data.meritListDate || "",
          meritListDateDisplay: data.meritListDateDisplay || "",
          selectionDates: Array.isArray(data.selectionDates)
            ? data.selectionDates
            : [],
          description: data.description || data.content || "",
          notificationNumber:
            data.notificationNumber || data.notificationNo || "",
          eligibility: data.eligibility || "",
          fees: data.fees || data.feeStructure || "",
          applicationProcess:
            data.applicationProcess || data.howToApply || "",
          documentsRequired: normalizeJobDocuments(data),
          contentSections: normalizeFlexibleDetailSections(
            data.contentSections || data.detailSections
          ),
          dataTables: normalizeFlexibleDataTables(
            data.dataTables || data.customTables
          ),
          applicationLink: data.applicationLink || "",
          notificationLink: data.notificationLink || "",
          dateExtensionPdfLink: data.dateExtensionPdfLink || "",
          commonProspectusPdfLink: data.commonProspectusPdfLink || "",
          extraLinks: Array.isArray(data.extraLinks) ? data.extraLinks : [],
          youtubeUrl: data.youtubeUrl || "",
          youtubeUrls: Array.isArray(data.youtubeUrls)
            ? data.youtubeUrls
            : [],
          sharingImageUrl:
            data.sharingImageUrl ||
            data.previewImageUrl ||
            data.imageUrl ||
            "",
          status: data.status === "closed" ? "closed" : "active",
        });
      } catch (error) {
        console.error("Failed to fetch admission:", error);
        alert("Failed to load admission post.");
      } finally {
        setLoading(false);
      }
    }

    fetchAdmission();
  }, [id, router, admissionOptions]);

  function handleChange(
    field: keyof AdmissionForm,
    value: AdmissionForm[keyof AdmissionForm]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function toggleCategory(value: string) {
    setForm((previous) => {
      const nextValues = previous.subCategories.includes(value)
        ? previous.subCategories.filter((item) => item !== value)
        : [...previous.subCategories, value];
      const primary =
        admissionOptions.find((item) => item.value === nextValues[0]) ||
        admissionOptions[0];

      return {
        ...previous,
        admissionCategory: primary?.label || "",
        subCategory: primary?.value || "",
        subCategories: nextValues,
        customAdmissionCategory: nextValues.includes("other-admissions")
          ? previous.customAdmissionCategory
          : "",
      };
    });
  }

  function addSelectionDate() {
    setForm((previous) => ({
      ...previous,
      selectionDates: [...previous.selectionDates, { label: "", value: "" }],
    }));
  }

  function updateSelectionDate(
    index: number,
    field: keyof DateRow,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      selectionDates: previous.selectionDates.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      ),
    }));
  }

  function removeSelectionDate(index: number) {
    setForm((previous) => ({
      ...previous,
      selectionDates: previous.selectionDates.filter(
        (_, rowIndex) => rowIndex !== index
      ),
    }));
  }

  function addExtraLink() {
    setForm((previous) => ({
      ...previous,
      extraLinks: [...previous.extraLinks, { label: "", url: "" }],
    }));
  }

  function updateExtraLink(index: number, field: keyof LinkRow, value: string) {
    setForm((previous) => ({
      ...previous,
      extraLinks: previous.extraLinks.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      ),
    }));
  }

  function removeExtraLink(index: number) {
    setForm((previous) => ({
      ...previous,
      extraLinks: previous.extraLinks.filter(
        (_, rowIndex) => rowIndex !== index
      ),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!id) return;

    if (!form.title.trim()) {
      alert("Please enter admission title.");
      return;
    }

    if (!form.lastDate && !form.lastDateDisplay.trim()) {
      alert("Please enter last date or date display text.");
      return;
    }

    if (form.subCategories.length === 0) {
      alert("Please select at least one admission subcategory.");
      return;
    }

    if (form.subCategories.includes("other-admissions") && !form.customAdmissionCategory.trim()) {
      alert("Please enter the new admission category name.");
      return;
    }

    setSaving(true);

    try {
      const ref = doc(db, "posts", id);
      const payload = buildAdmissionPayload(form, oldSlug);
      const validationReport = validateAdminContent(
        {
          title: payload.title,
          slug: payload.slug,
          description: payload.description,
          importantDates: payload.importantDates,
          importantLinks: payload.importantLinks,
        },
        { expectDescription: true, expectOfficialLink: true }
      );
      if (!confirmAdminValidation(validationReport)) return;

      await updateDoc(ref, payload);

      alert("Admission post updated successfully.");
      router.push("/admin/admissions");
    } catch (error) {
      console.error("Failed to update admission:", error);
      alert("Failed to update admission post.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <p style={{ fontSize: "14px", color: "#6b7280" }}>
          Loading admission post...
        </p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ display: "grid", gap: "24px" }}>
        <div>
          <Link
            href="/admin/admissions"
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#2563eb",
              textDecoration: "none",
            }}
          >
            ← Back to Admissions
          </Link>

          <h1
            style={{
              marginTop: "12px",
              fontSize: "24px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Edit Admission
          </h1>

          <p style={{ marginTop: "4px", fontSize: "14px", color: "#6b7280" }}>
            Update admission details.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Basic Information</h2>

            <div style={gridStyle}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => handleChange("title", event.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>
                  Admission Subcategories (select one or more)
                </label>
                <div className="admin-checkbox-grid">
                  {admissionOptions.map((item) => (
                    <label className="admin-checkbox-card" key={item.value}>
                      <input
                        type="checkbox"
                        checked={form.subCategories.includes(item.value)}
                        onChange={() => toggleCategory(item.value)}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              {form.subCategories.includes("other-admissions") ? (
                <div>
                  <label style={labelStyle}>New Admission Category Name</label>
                  <input
                    type="text"
                    value={form.customAdmissionCategory}
                    onChange={(event) =>
                      handleChange("customAdmissionCategory", event.target.value)
                    }
                    placeholder="Example: Nursing Admission / OSOU Admission"
                    style={inputStyle}
                  />
                </div>
              ) : null}

              <div>
                <label style={labelStyle}>Institute / Board / Department</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(event) =>
                    handleChange("department", event.target.value)
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Course / Programme Name</label>
                <input
                  type="text"
                  value={form.courseName}
                  onChange={(event) =>
                    handleChange("courseName", event.target.value)
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    handleChange(
                      "status",
                      event.target.value as AdmissionForm["status"]
                    )
                  }
                  style={inputStyle}
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Short Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    handleChange("description", event.target.value)
                  }
                  rows={5}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Notification / Reference Number</label>
                <input
                  type="text"
                  value={form.notificationNumber}
                  onChange={(event) =>
                    handleChange("notificationNumber", event.target.value)
                  }
                  placeholder="Optional"
                  style={inputStyle}
                />
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Important Dates</h2>

            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>Application Start Date</label>
                <input
                  type="date"
                  value={form.applicationStartDate}
                  onChange={(event) =>
                    handleChange("applicationStartDate", event.target.value)
                  }
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={form.applicationStartDateDisplay}
                  onChange={(event) =>
                    handleChange("applicationStartDateDisplay", event.target.value)
                  }
                  placeholder="Optional display: July 2026 / Coming Soon"
                  style={{ ...inputStyle, marginTop: "8px" }}
                />
              </div>

              <div>
                <label style={labelStyle}>Last Date</label>
                <input
                  type="date"
                  value={form.lastDate}
                  onChange={(event) =>
                    handleChange("lastDate", event.target.value)
                  }
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={form.lastDateDisplay}
                  onChange={(event) =>
                    handleChange("lastDateDisplay", event.target.value)
                  }
                  placeholder="Optional display: Expected in July 2026"
                  style={{ ...inputStyle, marginTop: "8px" }}
                />
              </div>

              <div>
                <label style={labelStyle}>Main Selection / Merit List Date</label>
                <input
                  type="date"
                  value={form.meritListDate}
                  onChange={(event) =>
                    handleChange("meritListDate", event.target.value)
                  }
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={form.meritListDateDisplay}
                  onChange={(event) =>
                    handleChange("meritListDateDisplay", event.target.value)
                  }
                  placeholder="Optional display: Date to be announced"
                  style={{ ...inputStyle, marginTop: "8px" }}
                />
              </div>
            </div>

            <div style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <h3 style={{ fontSize: "15px", fontWeight: 700 }}>
                  Extra Selection / Merit List Dates
                </h3>

                <button
                  type="button"
                  onClick={addSelectionDate}
                  style={{
                    border: "none",
                    borderRadius: "8px",
                    background: "#eef2ff",
                    color: "#3730a3",
                    padding: "8px 12px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Add Date Row
                </button>
              </div>

              {form.selectionDates.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#6b7280" }}>
                  Add rows like 1st Selection, 2nd Selection, Spot Selection.
                </p>
              ) : (
                form.selectionDates.map((row, index) => (
                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(180px, 1fr) minmax(160px, 220px) auto",
                      gap: "10px",
                      alignItems: "end",
                    }}
                  >
                    <div>
                      <label style={labelStyle}>Label</label>
                      <input
                        type="text"
                        value={row.label}
                        onChange={(event) =>
                          updateSelectionDate(index, "label", event.target.value)
                        }
                        placeholder="1st Selection / Spot Selection"
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Date</label>
                      <input
                        type="date"
                        value={row.value}
                        onChange={(event) =>
                          updateSelectionDate(index, "value", event.target.value)
                        }
                        style={inputStyle}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSelectionDate(index)}
                      style={{
                        border: "none",
                        borderRadius: "8px",
                        background: "#fef2f2",
                        color: "#dc2626",
                        padding: "10px 12px",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Important Links</h2>

            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>Apply Online Link</label>
                <input
                  type="url"
                  value={form.applicationLink}
                  onChange={(event) =>
                    handleChange("applicationLink", event.target.value)
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Official Notification Link</label>
                <input
                  type="url"
                  value={form.notificationLink}
                  onChange={(event) =>
                    handleChange("notificationLink", event.target.value)
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Date Extension Notice PDF Link</label>
                <input
                  type="url"
                  value={form.dateExtensionPdfLink}
                  onChange={(event) =>
                    handleChange("dateExtensionPdfLink", event.target.value)
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Common Prospectus PDF Link</label>
                <input
                  type="url"
                  value={form.commonProspectusPdfLink}
                  onChange={(event) =>
                    handleChange("commonProspectusPdfLink", event.target.value)
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: "16px", display: "grid", gap: "12px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <h3 style={{ fontSize: "15px", fontWeight: 700 }}>
                  Extra Important Links
                </h3>

                <button
                  type="button"
                  onClick={addExtraLink}
                  style={{
                    border: "none",
                    borderRadius: "8px",
                    background: "#eef2ff",
                    color: "#3730a3",
                    padding: "8px 12px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Add Link Row
                </button>
              </div>

              {form.extraLinks.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#6b7280" }}>
                  Add rows like Revised Timeline PDF, 1st Merit List PDF,
                  Intimation Letter Link.
                </p>
              ) : (
                form.extraLinks.map((row, index) => (
                  <div
                    key={index}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(180px, 1fr) minmax(220px, 2fr) auto",
                      gap: "10px",
                      alignItems: "end",
                    }}
                  >
                    <div>
                      <label style={labelStyle}>Link Label</label>
                      <input
                        type="text"
                        value={row.label}
                        onChange={(event) =>
                          updateExtraLink(index, "label", event.target.value)
                        }
                        placeholder="1st Merit List PDF"
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>URL</label>
                      <input
                        type="url"
                        value={row.url}
                        onChange={(event) =>
                          updateExtraLink(index, "url", event.target.value)
                        }
                        placeholder="https://..."
                        style={inputStyle}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeExtraLink(index)}
                      style={{
                        border: "none",
                        borderRadius: "8px",
                        background: "#fef2f2",
                        color: "#dc2626",
                        padding: "10px 12px",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Media</h2>

            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>YouTube Video Link</label>
                <input
                  type="url"
                  value={form.youtubeUrl}
                  onChange={(event) =>
                    handleChange("youtubeUrl", event.target.value)
                  }
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Sharing Media Image Link</label>
                <input
                  type="url"
                  value={form.sharingImageUrl}
                  onChange={(event) =>
                    handleChange("sharingImageUrl", event.target.value)
                  }
                  style={inputStyle}
                />
              </div>
            </div>
          </section>

          <FlexibleDetailsEditor
            detailSections={form.contentSections}
            dataTables={form.dataTables}
            onDetailSectionsChange={(contentSections) =>
              handleChange("contentSections", contentSections)
            }
            onDataTablesChange={(dataTables) =>
              handleChange("dataTables", dataTables)
            }
            sectionLabel="Optional Admission Details and Data Tables"
          />

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Eligibility, Fees and Application Process</h2>
            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>Eligibility</label>
                <textarea
                  value={form.eligibility}
                  onChange={(event) =>
                    handleChange("eligibility", event.target.value)
                  }
                  rows={6}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Fees</label>
                <textarea
                  value={form.fees}
                  onChange={(event) => handleChange("fees", event.target.value)}
                  rows={6}
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ marginTop: "14px" }}>
              <label style={labelStyle}>Application Process / How to Apply</label>
              <textarea
                value={form.applicationProcess}
                onChange={(event) =>
                  handleChange("applicationProcess", event.target.value)
                }
                rows={7}
                style={inputStyle}
              />
            </div>
          </section>

          <CommonDocumentsEditor
            documents={form.documentsRequired}
            onChange={(documentsRequired) =>
              handleChange("documentsRequired", documentsRequired)
            }
          />

          <button
            type="submit"
            disabled={saving}
            style={{
              width: "fit-content",
              border: "none",
              borderRadius: "10px",
              background: saving ? "#9ca3af" : "#2563eb",
              color: "#ffffff",
              padding: "10px 18px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Updating..." : "Update Admission"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
