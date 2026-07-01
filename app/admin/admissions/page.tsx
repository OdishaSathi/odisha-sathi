"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import Link from "next/link";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
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

type AdmissionPost = AdmissionForm & {
  id: string;
  slug?: string;
  category?: string;
  createdAt?: {
    toMillis?: () => number;
  };
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

function buildAdmissionPayload(form: AdmissionForm) {
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
    slug: "",
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
  };
}

export default function AdminAdmissionsPage() {
  const [form, setForm] = useState<AdmissionForm>(emptyForm);
  const [admissions, setAdmissions] = useState<AdmissionPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  async function fetchAdmissions() {
    setListLoading(true);

    try {
      const q = query(
        collection(db, "posts"),
        where("category", "==", "admissions")
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...(item.data() as Omit<AdmissionPost, "id">),
        }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

      setAdmissions(data);
    } catch (error) {
      console.error("Failed to fetch admissions:", error);
      alert("Failed to load admissions.");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    fetchAdmissions();
  }, []);

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

    if (!form.title.trim()) {
      alert("Please enter admission title.");
      return;
    }

    if (!form.lastDate) {
      alert("Please enter last date.");
      return;
    }

    setLoading(true);

    try {
      const docRef = doc(collection(db, "posts"));
      const slug = `${makeSlug(form.title)}-${docRef.id.slice(0, 6)}`;

      const payload = {
        ...buildAdmissionPayload(form),
        slug,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, payload);

      setForm(emptyForm);
      await fetchAdmissions();

      alert("Admission post added successfully.");
    } catch (error) {
      console.error("Failed to add admission:", error);
      alert("Failed to add admission post.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this admission post?"
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "posts", id));
      await fetchAdmissions();
      alert("Admission post deleted successfully.");
    } catch (error) {
      console.error("Failed to delete admission:", error);
      alert("Failed to delete admission post.");
    }
  }

  return (
    <AdminLayout>
      <div style={{ display: "grid", gap: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>
            Admissions Manager
          </h1>
          <p style={{ marginTop: "4px", fontSize: "14px", color: "#6b7280" }}>
            Add and manage all admission updates.
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
                  placeholder="+2 Admission 2026 Online Apply"
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
                  placeholder="SAMS Odisha"
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
                  placeholder="Write short admission details here..."
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
                  placeholder="https://..."
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
                  placeholder="https://..."
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
                  placeholder="https://..."
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
                  placeholder="https://..."
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
                  placeholder="https://youtube.com/..."
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
                  placeholder="https://image-link..."
                  style={inputStyle}
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "fit-content",
              border: "none",
              borderRadius: "10px",
              background: loading ? "#9ca3af" : "#2563eb",
              color: "#ffffff",
              padding: "10px 18px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Saving..." : "Save Admission"}
          </button>
        </form>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Existing Admission Posts</h2>

          {listLoading ? (
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              Loading admissions...
            </p>
          ) : admissions.length === 0 ? (
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              No admission posts added yet.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {admissions.map((post) => (
                <div
                  key={post.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                    padding: "16px",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {post.title}
                    </p>
                    <p
                      style={{
                        marginTop: "4px",
                        fontSize: "14px",
                        color: "#6b7280",
                      }}
                    >
                      {post.department || "Department not added"} |{" "}
                      {post.admissionCategory || "+2 Admission"} |{" "}
                      {post.status === "closed" ? "Closed" : "Active"}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <Link
                      href={`/admin/admissions/edit/${post.id}`}
                      style={{
                        borderRadius: "8px",
                        background: "#f3f4f6",
                        padding: "8px 14px",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#374151",
                        textDecoration: "none",
                      }}
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(post.id)}
                      style={{
                        border: "none",
                        borderRadius: "8px",
                        background: "#fef2f2",
                        padding: "8px 14px",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "#dc2626",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}