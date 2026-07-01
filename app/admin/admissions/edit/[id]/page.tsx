"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import AdminLayout from "@/components/admin/AdminLayout";
import { db } from "@/lib/firebase";

const admissionCategoryOptions = [
  { label: "+2 Admission", value: "plus-two-admission" },
  { label: "+3 Admission", value: "plus-three-admission" },
  { label: "Diploma Admission", value: "diploma-admission" },
  { label: "ITI Admission", value: "iti-admission" },
  { label: "B.Ed / Teacher Training", value: "bed-teacher-training" },
  { label: "Other Admissions", value: "other-admissions" },
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
  department: string;
  applicationStartDate: string;
  lastDate: string;
  meritListDate: string;
  selectionDates: DateRow[];
  description: string;
  applicationLink: string;
  notificationLink: string;
  dateExtensionPdfLink: string;
  commonProspectusPdfLink: string;
  extraLinks: LinkRow[];
  youtubeUrl: string;
  sharingImageUrl: string;
  status: "active" | "closed";
};

const emptyForm: AdmissionForm = {
  title: "",
  admissionCategory: "+2 Admission",
  subCategory: "plus-two-admission",
  department: "",
  applicationStartDate: "",
  lastDate: "",
  meritListDate: "",
  selectionDates: [],
  description: "",
  applicationLink: "",
  notificationLink: "",
  dateExtensionPdfLink: "",
  commonProspectusPdfLink: "",
  extraLinks: [],
  youtubeUrl: "",
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

  const importantDates = [
    {
      label: "Application Start Date",
      value: form.applicationStartDate,
    },
    {
      label: "Last Date",
      value: form.lastDate,
    },
    {
      label: "Selection / Merit List Date",
      value: form.meritListDate,
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
    subCategory: form.subCategory,
    admissionCategory: form.admissionCategory,
    department: form.department.trim(),
    applicationStartDate: form.applicationStartDate,
    lastDate: form.lastDate,
    meritListDate: form.meritListDate,
    selectionDates,
    description: form.description.trim(),
    content: form.description.trim(),
    applicationLink: form.applicationLink.trim(),
    notificationLink: form.notificationLink.trim(),
    dateExtensionPdfLink: form.dateExtensionPdfLink.trim(),
    commonProspectusPdfLink: form.commonProspectusPdfLink.trim(),
    extraLinks,
    youtubeUrl: form.youtubeUrl.trim(),
    sharingImageUrl: form.sharingImageUrl.trim(),
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
  const [oldSlug, setOldSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

        const savedSubCategory =
          data.subCategory || getSubCategoryFromLabel(data.admissionCategory);

        setOldSlug(data.slug || "");

        setForm({
          title: data.title || "",
          admissionCategory:
            data.admissionCategory || getLabelFromSubCategory(savedSubCategory),
          subCategory: savedSubCategory,
          department: data.department || "",
          applicationStartDate: data.applicationStartDate || "",
          lastDate: data.lastDate || "",
          meritListDate: data.meritListDate || "",
          selectionDates: Array.isArray(data.selectionDates)
            ? data.selectionDates
            : [],
          description: data.description || data.content || "",
          applicationLink: data.applicationLink || "",
          notificationLink: data.notificationLink || "",
          dateExtensionPdfLink: data.dateExtensionPdfLink || "",
          commonProspectusPdfLink: data.commonProspectusPdfLink || "",
          extraLinks: Array.isArray(data.extraLinks) ? data.extraLinks : [],
          youtubeUrl: data.youtubeUrl || "",
          sharingImageUrl: data.sharingImageUrl || "",
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
  }, [id, router]);

  function handleChange(
    field: keyof AdmissionForm,
    value: AdmissionForm[keyof AdmissionForm]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleCategoryChange(value: string) {
    const selectedCategory = admissionCategoryOptions.find(
      (item) => item.value === value
    );

    if (!selectedCategory) return;

    setForm((previous) => ({
      ...previous,
      admissionCategory: selectedCategory.label,
      subCategory: selectedCategory.value,
    }));
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

    if (!form.lastDate) {
      alert("Please enter last date.");
      return;
    }

    setSaving(true);

    try {
      const ref = doc(db, "posts", id);
      await updateDoc(ref, buildAdmissionPayload(form, oldSlug));

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

              <div>
                <label style={labelStyle}>Admission Category</label>
                <select
                  value={form.subCategory}
                  onChange={(event) => handleCategoryChange(event.target.value)}
                  style={inputStyle}
                >
                  {admissionCategoryOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

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