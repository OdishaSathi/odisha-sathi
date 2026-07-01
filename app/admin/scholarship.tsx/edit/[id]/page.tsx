"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
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

function buildScholarshipPayload(form: ScholarshipForm, oldSlug?: string) {
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
    slug: oldSlug || makeSlug(form.title),
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
    updatedAt: serverTimestamp(),
  };
}

export default function EditScholarshipPage() {
  const params = useParams();
  const router = useRouter();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [form, setForm] = useState<ScholarshipForm>(emptyForm);
  const [oldSlug, setOldSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchScholarship() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "posts", id);
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
          alert("Scholarship post not found.");
          router.push("/admin/scholarships");
          return;
        }

        const data = snapshot.data();

        setOldSlug(data.slug || "");

        setForm({
          title: data.title || "",
          scholarshipCategory: data.scholarshipCategory || "State Scholarships",
          subCategory: data.subCategory || "state-scholarships",
          department: data.department || "",
          eligibility: data.eligibility || "",
          applicationStartDate: data.applicationStartDate || "",
          lastDate: data.lastDate || "",
          amountBenefit: data.amountBenefit || "",
          description: data.description || data.content || "",
          applicationLink: data.applicationLink || "",
          notificationLink: data.notificationLink || "",
          guidelinePdfLink: data.guidelinePdfLink || "",
          youtubeUrl: data.youtubeUrl || "",
          status: data.status === "closed" ? "closed" : "active",
        });
      } catch (error) {
        console.error("Failed to fetch scholarship:", error);
        alert("Failed to load scholarship post.");
      } finally {
        setLoading(false);
      }
    }

    fetchScholarship();
  }, [id, router]);

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

    if (!id) return;

    if (!form.title.trim()) {
      alert("Please enter scholarship title.");
      return;
    }

    if (!form.lastDate) {
      alert("Please enter last date.");
      return;
    }

    setSaving(true);

    try {
      const ref = doc(db, "posts", id);
      await updateDoc(ref, buildScholarshipPayload(form, oldSlug));

      alert("Scholarship post updated successfully.");
      router.push("/admin/scholarships");
    } catch (error) {
      console.error("Failed to update scholarship:", error);
      alert("Failed to update scholarship post.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <p style={{ fontSize: "14px", color: "#6b7280" }}>
          Loading scholarship post...
        </p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ display: "grid", gap: "24px" }}>
        <div>
          <Link
            href="/admin/scholarships"
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#2563eb",
              textDecoration: "none",
            }}
          >
            ← Back to Scholarships
          </Link>

          <h1
            style={{
              marginTop: "12px",
              fontSize: "24px",
              fontWeight: 700,
              color: "#111827",
            }}
          >
            Edit Scholarship
          </h1>

          <p style={{ marginTop: "4px", fontSize: "14px", color: "#6b7280" }}>
            Update scholarship details.
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
                <label style={labelStyle}>Guideline PDF Link</label>
                <input
                  type="url"
                  value={form.guidelinePdfLink}
                  onChange={(event) =>
                    handleChange("guidelinePdfLink", event.target.value)
                  }
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
            {saving ? "Updating..." : "Update Scholarship"}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}