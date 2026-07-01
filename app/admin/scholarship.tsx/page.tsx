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

const scholarshipCategoryOptions = [
  { label: "State Scholarships", value: "state-scholarships" },
];

type ScholarshipForm = {
  title: string;
  scholarshipCategory: string;
  subCategory: string;
  department: string;
  eligibility: string;
  applicationStartDate: string;
  lastDate: string;
  amountBenefit: string;
  description: string;
  applicationLink: string;
  notificationLink: string;
  guidelinePdfLink: string;
  youtubeUrl: string;
  status: "active" | "closed";
};

type ScholarshipPost = ScholarshipForm & {
  id: string;
  slug?: string;
  category?: string;
  createdAt?: {
    toMillis?: () => number;
  };
};

const emptyForm: ScholarshipForm = {
  title: "",
  scholarshipCategory: "State Scholarships",
  subCategory: "state-scholarships",
  department: "",
  eligibility: "",
  applicationStartDate: "",
  lastDate: "",
  amountBenefit: "",
  description: "",
  applicationLink: "",
  notificationLink: "",
  guidelinePdfLink: "",
  youtubeUrl: "",
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

  return slug || `scholarship-${Date.now()}`;
}

function buildScholarshipPayload(form: ScholarshipForm) {
  const importantDates = [
    {
      label: "Application Start Date",
      value: form.applicationStartDate,
    },
    {
      label: "Last Date",
      value: form.lastDate,
    },
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
      label: "Guideline PDF",
      url: form.guidelinePdfLink.trim(),
    },
  ].filter((item) => item.url);

  return {
    title: form.title.trim(),
    slug: "",
    category: "scholarships",
    type: "scholarships",
    subCategory: form.subCategory,
    scholarshipCategory: form.scholarshipCategory,
    department: form.department.trim(),
    eligibility: form.eligibility.trim(),
    applicationStartDate: form.applicationStartDate,
    lastDate: form.lastDate,
    amountBenefit: form.amountBenefit.trim(),
    description: form.description.trim(),
    content: form.description.trim(),
    applicationLink: form.applicationLink.trim(),
    notificationLink: form.notificationLink.trim(),
    guidelinePdfLink: form.guidelinePdfLink.trim(),
    youtubeUrl: form.youtubeUrl.trim(),
    status: form.status,
    published: true,
    importantDates,
    importantLinks,
    links: importantLinks,
  };
}

export default function AdminScholarshipsPage() {
  const [form, setForm] = useState<ScholarshipForm>(emptyForm);
  const [scholarships, setScholarships] = useState<ScholarshipPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  async function fetchScholarships() {
    setListLoading(true);

    try {
      const q = query(
        collection(db, "posts"),
        where("category", "==", "scholarships")
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...(item.data() as Omit<ScholarshipPost, "id">),
        }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

      setScholarships(data);
    } catch (error) {
      console.error("Failed to fetch scholarships:", error);
      alert("Failed to load scholarships.");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    fetchScholarships();
  }, []);

  function handleChange(
    field: keyof ScholarshipForm,
    value: ScholarshipForm[keyof ScholarshipForm]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleCategoryChange(value: string) {
    const selectedCategory = scholarshipCategoryOptions.find(
      (item) => item.value === value
    );

    if (!selectedCategory) return;

    setForm((previous) => ({
      ...previous,
      scholarshipCategory: selectedCategory.label,
      subCategory: selectedCategory.value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      alert("Please enter scholarship title.");
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
        ...buildScholarshipPayload(form),
        slug,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, payload);

      setForm(emptyForm);
      await fetchScholarships();

      alert("Scholarship post added successfully.");
    } catch (error) {
      console.error("Failed to add scholarship:", error);
      alert("Failed to add scholarship post.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this scholarship post?"
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "posts", id));
      await fetchScholarships();
      alert("Scholarship post deleted successfully.");
    } catch (error) {
      console.error("Failed to delete scholarship:", error);
      alert("Failed to delete scholarship post.");
    }
  }

  return (
    <AdminLayout>
      <div style={{ display: "grid", gap: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>
            Scholarships Manager
          </h1>
          <p style={{ marginTop: "4px", fontSize: "14px", color: "#6b7280" }}>
            Add and manage state scholarship updates.
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
                  placeholder="State Scholarship 2026 Online Apply"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Scholarship Category</label>
                <select
                  value={form.subCategory}
                  onChange={(event) => handleCategoryChange(event.target.value)}
                  style={inputStyle}
                >
                  {scholarshipCategoryOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Department / Portal</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(event) =>
                    handleChange("department", event.target.value)
                  }
                  placeholder="State Scholarship Portal Odisha"
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
                      event.target.value as ScholarshipForm["status"]
                    )
                  }
                  style={inputStyle}
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Eligibility</label>
                <textarea
                  value={form.eligibility}
                  onChange={(event) =>
                    handleChange("eligibility", event.target.value)
                  }
                  rows={4}
                  placeholder="Write eligibility details here..."
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Short Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    handleChange("description", event.target.value)
                  }
                  rows={5}
                  placeholder="Write short scholarship details here..."
                  style={inputStyle}
                />
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Important Dates & Benefit</h2>

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

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Amount / Benefit</label>
                <input
                  type="text"
                  value={form.amountBenefit}
                  onChange={(event) =>
                    handleChange("amountBenefit", event.target.value)
                  }
                  placeholder="Example: ₹5,000 / ₹10,000 / Tuition fee support"
                  style={inputStyle}
                />
              </div>
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
                <label style={labelStyle}>Guideline PDF Link</label>
                <input
                  type="url"
                  value={form.guidelinePdfLink}
                  onChange={(event) =>
                    handleChange("guidelinePdfLink", event.target.value)
                  }
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>
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
                  placeholder="https://www.youtube.com/watch?v=..."
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
            {loading ? "Saving..." : "Save Scholarship"}
          </button>
        </form>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>Existing Scholarship Posts</h2>

          {listLoading ? (
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              Loading scholarships...
            </p>
          ) : scholarships.length === 0 ? (
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              No scholarship posts added yet.
            </p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {scholarships.map((post) => (
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
                      {post.scholarshipCategory || "State Scholarships"} |{" "}
                      {post.status === "closed" ? "Closed" : "Active"}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <Link
                      href={`/admin/scholarships/edit/${post.id}`}
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