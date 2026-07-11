"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import AdminLayout from "@/components/admin/AdminLayout";
import { db } from "@/lib/firebase";

type SubCategoryPost = {
  id: string;
  category?: string;
  subCategory?: string;
  subCategories?: string[];
  schemeCategory?: string;
};

type ManagedSubCategory = {
  id: string;
  parentSection: string;
  name: string;
  slug: string;
  status: "active" | "hidden";
  displayOrder: number;
  description?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type SubCategoryForm = {
  parentSection: string;
  name: string;
  slug: string;
  status: "active" | "hidden";
  displayOrder: number;
  description: string;
};

const parentSections = [
  { key: "jobs", label: "Jobs" },
  { key: "admissions", label: "Admissions" },
  { key: "admit-cards", label: "Admit Cards & Exams" },
  { key: "results", label: "Results" },
  { key: "schemes", label: "Schemes" },
];

const defaultForm: SubCategoryForm = {
  parentSection: "jobs",
  name: "",
  slug: "",
  status: "active",
  displayOrder: 1,
  description: "",
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "16px",
  padding: "18px",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  color: "#374151",
  fontSize: "14px",
  fontWeight: 800,
};

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function makeSlug(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || `subcategory-${Date.now()}`;
}

function normalizeStatus(value: unknown): "active" | "hidden" {
  return value === "hidden" ? "hidden" : "active";
}

export default function AdminCategoriesPage() {
  const [posts, setPosts] = useState<SubCategoryPost[]>([]);
  const [managedCategories, setManagedCategories] = useState<ManagedSubCategory[]>([]);
  const [form, setForm] = useState<SubCategoryForm>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSubCategoryData() {
    try {
      setLoading(true);
      setMessage("");

      const [postSnapshot, categorySnapshot] = await Promise.all([
        getDocs(collection(db, "posts")),
        getDocs(collection(db, "subCategories")),
      ]);

      const postList = postSnapshot.docs.map((docItem) => {
        const data = docItem.data();
        return {
          id: docItem.id,
          category: data.category || "",
          subCategory: data.subCategory || "",
          subCategories: Array.isArray(data.subCategories) ? data.subCategories : [],
          schemeCategory: data.schemeCategory || "",
        };
      });

      const categoryList = categorySnapshot.docs
        .map((docItem) => {
          const data = docItem.data();
          return {
            id: docItem.id,
            parentSection: cleanText(data.parentSection),
            name: cleanText(data.name),
            slug: cleanText(data.slug),
            status: normalizeStatus(data.status),
            displayOrder: Number(data.displayOrder || 999),
            description: cleanText(data.description),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          };
        })
        .filter((item) => item.parentSection && item.name)
        .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));

      setPosts(postList);
      setManagedCategories(categoryList);
    } catch (error) {
      console.error(error);
      setMessage(
        "Sub Categories could not be loaded. If this shows missing permissions, allow authenticated admin access to the subCategories collection in Firebase rules."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSubCategoryData();
  }, []);

  const postUsageBySection = useMemo(() => {
    return parentSections.reduce<Record<string, Map<string, number>>>((result, section) => {
      const counter = new Map<string, number>();

      posts
        .filter((post) => post.category === section.key)
        .forEach((post) => {
          const names = new Set<string>();

          if (Array.isArray(post.subCategories)) {
            post.subCategories.forEach((item) => {
              const cleanName = cleanText(item);
              if (cleanName) names.add(cleanName);
            });
          }

          const singleSubCategory = cleanText(post.subCategory);
          if (singleSubCategory) names.add(singleSubCategory);

          if (section.key === "schemes") {
            const schemeCategory = cleanText(post.schemeCategory);
            if (schemeCategory) names.add(schemeCategory);
          }

          names.forEach((name) => {
            counter.set(name, (counter.get(name) || 0) + 1);
          });
        });

      result[section.key] = counter;
      return result;
    }, {});
  }, [posts]);

  const overview = useMemo(() => {
    return parentSections.map((section) => {
      const usageCounter = postUsageBySection[section.key] || new Map<string, number>();
      const managed = managedCategories.filter((item) => item.parentSection === section.key);
      const managedNames = new Set<string>();
      const managedSlugs = new Set<string>();

      managed.forEach((item) => {
        managedNames.add(item.name.toLowerCase());
        managedSlugs.add(item.slug.toLowerCase());
      });

      const unmanaged = Array.from(usageCounter.entries())
        .filter(([name]) => {
          const cleanName = name.toLowerCase();
          return !managedNames.has(cleanName) && !managedSlugs.has(cleanName);
        })
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return {
        ...section,
        managed,
        unmanaged,
        totalUsedNames: usageCounter.size,
      };
    });
  }, [managedCategories, postUsageBySection]);

  function updateForm<K extends keyof SubCategoryForm>(field: K, value: SubCategoryForm[K]) {
    setForm((previous) => {
      if (field === "name") {
        const name = String(value);
        const shouldAutoSlug = !previous.slug || previous.slug === makeSlug(previous.name);

        return {
          ...previous,
          name,
          slug: shouldAutoSlug ? makeSlug(name) : previous.slug,
        };
      }

      return { ...previous, [field]: value };
    });
  }

  function startEdit(item: ManagedSubCategory) {
    setEditingId(item.id);
    setForm({
      parentSection: item.parentSection,
      name: item.name,
      slug: item.slug || makeSlug(item.name),
      status: item.status,
      displayOrder: Number(item.displayOrder || 1),
      description: item.description || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(defaultForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.parentSection || !form.name.trim()) {
      alert("Please select section and enter subcategory name.");
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      parentSection: form.parentSection,
      name: form.name.trim(),
      slug: makeSlug(form.slug || form.name),
      status: form.status,
      displayOrder: Number(form.displayOrder || 1),
      description: form.description.trim(),
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "subCategories", editingId), payload);
        setMessage("Subcategory updated safely. Existing posts and public paths are unchanged.");
      } else {
        await addDoc(collection(db, "subCategories"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setMessage("Subcategory added safely. It is saved for admin management and does not change public pages automatically.");
      }

      resetForm();
      await loadSubCategoryData();
    } catch (error) {
      console.error(error);
      setMessage(
        "Failed to save subcategory. If Firebase says missing permissions, allow authenticated admin access to the subCategories collection."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: ManagedSubCategory) {
    const confirmed = window.confirm(
      `Delete only the admin subcategory record for "${item.name}"? Existing posts will NOT be deleted and public pages will remain unchanged.`
    );

    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "subCategories", item.id));
      setMessage("Subcategory record deleted safely. Existing posts and public pages were not changed.");
      await loadSubCategoryData();
    } catch (error) {
      console.error(error);
      setMessage(
        "Failed to delete subcategory. If Firebase says missing permissions, allow authenticated admin access to the subCategories collection."
      );
    }
  }

  function getPostCount(sectionKey: string, item: ManagedSubCategory) {
    const counter = postUsageBySection[sectionKey] || new Map<string, number>();
    return (counter.get(item.name) || 0) + (item.slug !== item.name ? counter.get(item.slug) || 0 : 0);
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
            <h1 style={{ margin: "0 0 6px", color: "#111827" }}>Sub Categories</h1>
            <p style={{ margin: 0, color: "#64748b" }}>
              Manage subcategory names safely. Public display, search, homepage
              and existing upload paths remain untouched in this phase.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSubCategoryData}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: "10px",
              background: "#ffffff",
              padding: "10px 14px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        {message ? (
          <section
            style={{
              background: message.includes("Failed") || message.includes("could not") ? "#fff7ed" : "#ecfdf5",
              border: message.includes("Failed") || message.includes("could not") ? "1px solid #fed7aa" : "1px solid #bbf7d0",
              borderRadius: "14px",
              padding: "14px",
              color: message.includes("Failed") || message.includes("could not") ? "#9a3412" : "#166534",
              fontWeight: 800,
              lineHeight: 1.5,
            }}
          >
            {message}
          </section>
        ) : null}

        <section
          style={{
            background: "#ecfdf5",
            border: "1px solid #bbf7d0",
            borderRadius: "16px",
            padding: "18px",
          }}
        >
          <h2 style={{ margin: "0 0 8px", color: "#166534", fontSize: "20px" }}>
            Strict safety rule
          </h2>
          <p style={{ margin: 0, color: "#166534", lineHeight: 1.65 }}>
            Add, edit, hide or delete actions here only manage the admin
            subcategory catalog. They do not delete posts, rewrite old post
            categories, change public URLs, or disturb search/category/homepage
            behavior.
          </p>
        </section>

        <form onSubmit={handleSubmit} style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <div>
              <h2 style={{ margin: 0, color: "#0f172a", fontSize: "20px" }}>
                {editingId ? "Edit Subcategory" : "Add New Subcategory"}
              </h2>
              <p style={{ margin: "5px 0 0", color: "#64748b", fontSize: "14px" }}>
                This is an admin catalog entry. It will not affect existing public pages automatically.
              </p>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  background: "#ffffff",
                  padding: "9px 12px",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Cancel Edit
              </button>
            ) : null}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "14px",
            }}
          >
            <label>
              <span style={labelStyle}>Parent Section</span>
              <select style={inputStyle} value={form.parentSection} onChange={(event) => updateForm("parentSection", event.target.value)}>
                {parentSections.map((section) => (
                  <option key={section.key} value={section.key}>
                    {section.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span style={labelStyle}>Subcategory Name</span>
              <input style={inputStyle} value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Example: Nursing Admission" />
            </label>

            <label>
              <span style={labelStyle}>Slug</span>
              <input style={inputStyle} value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} placeholder="nursing-admission" />
            </label>

            <label>
              <span style={labelStyle}>Display Order</span>
              <input type="number" min={1} style={inputStyle} value={form.displayOrder} onChange={(event) => updateForm("displayOrder", Number(event.target.value))} />
            </label>

            <label>
              <span style={labelStyle}>Status</span>
              <select style={inputStyle} value={form.status} onChange={(event) => updateForm("status", event.target.value as "active" | "hidden")}>
                <option value="active">Active</option>
                <option value="hidden">Hidden</option>
              </select>
            </label>

            <label style={{ gridColumn: "1 / -1" }}>
              <span style={labelStyle}>Admin Note / Description</span>
              <textarea style={{ ...inputStyle, minHeight: "80px" }} value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Optional note for admin reference" />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: "16px",
              border: "1px solid #2563eb",
              borderRadius: "10px",
              background: saving ? "#94a3b8" : "#2563eb",
              color: "#ffffff",
              padding: "10px 14px",
              fontWeight: 900,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : editingId ? "Update Subcategory" : "Save Subcategory"}
          </button>
        </form>

        {loading ? (
          <section style={cardStyle}>Loading subcategory data...</section>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
              gap: "16px",
            }}
          >
            {overview.map((section) => (
              <section key={section.key} style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <h2 style={{ margin: 0, color: "#0f172a", fontSize: "20px" }}>
                    {section.label}
                  </h2>
                  <span
                    style={{
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      borderRadius: "999px",
                      padding: "5px 9px",
                      fontSize: "12px",
                      fontWeight: 900,
                    }}
                  >
                    {section.managed.length} managed
                  </span>
                </div>

                <div style={{ display: "grid", gap: "10px" }}>
                  {section.managed.length === 0 ? (
                    <p style={{ margin: 0, color: "#64748b" }}>No managed subcategory added yet.</p>
                  ) : (
                    section.managed.map((item) => {
                      const postCount = getPostCount(section.key, item);
                      return (
                        <div
                          key={item.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            padding: "12px",
                            display: "grid",
                            gap: "8px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                            <div>
                              <strong style={{ color: "#111827" }}>{item.name}</strong>
                              <div style={{ color: "#64748b", fontSize: "12px", marginTop: "3px" }}>
                                /{item.slug} • Order {item.displayOrder} • {postCount} posts
                              </div>
                            </div>
                            <span
                              style={{
                                alignSelf: "start",
                                borderRadius: "999px",
                                padding: "4px 8px",
                                fontSize: "11px",
                                fontWeight: 900,
                                background: item.status === "active" ? "#ecfdf5" : "#f1f5f9",
                                color: item.status === "active" ? "#166534" : "#475569",
                              }}
                            >
                              {item.status}
                            </span>
                          </div>

                          {item.description ? (
                            <p style={{ margin: 0, color: "#64748b", fontSize: "13px", lineHeight: 1.45 }}>
                              {item.description}
                            </p>
                          ) : null}

                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              style={{
                                border: "1px solid #bfdbfe",
                                borderRadius: "9px",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                padding: "7px 10px",
                                fontWeight: 900,
                                cursor: "pointer",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              style={{
                                border: "1px solid #fecaca",
                                borderRadius: "9px",
                                background: "#fff1f2",
                                color: "#be123c",
                                padding: "7px 10px",
                                fontWeight: 900,
                                cursor: "pointer",
                              }}
                            >
                              Delete Record
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {section.unmanaged.length ? (
                  <div style={{ marginTop: "16px" }}>
                    <h3 style={{ margin: "0 0 8px", color: "#334155", fontSize: "15px" }}>
                      Used in posts but not managed yet
                    </h3>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {section.unmanaged.map((item) => (
                        <div
                          key={item.name}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "10px",
                            border: "1px dashed #cbd5e1",
                            borderRadius: "10px",
                            padding: "9px 10px",
                          }}
                        >
                          <span style={{ color: "#111827", fontWeight: 800 }}>{item.name}</span>
                          <span style={{ color: "#64748b", fontSize: "13px" }}>{item.count} posts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        )}

        <section
          style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: "16px",
            padding: "18px",
          }}
        >
          <h2 style={{ margin: "0 0 8px", color: "#9a3412", fontSize: "20px" }}>
            Next safe connection
          </h2>
          <p style={{ margin: 0, color: "#7c2d12", lineHeight: 1.65 }}>
            After you approve this manager, we can connect selected active
            subcategories to admin post forms. Public listing/search logic will
            still stay based on saved post data, so new and old subcategories
            follow the same display rules.
          </p>
        </section>
      </div>
    </AdminLayout>
  );
}
