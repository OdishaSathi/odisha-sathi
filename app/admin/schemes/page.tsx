"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import SchemeForm from "../../../components/forms/SchemeForm";
import { getActiveAdminSubCategories } from "@/lib/adminSubCategories";
import * as AdminLayoutModule from "../../../components/admin/AdminLayout";
import AdminPostShareButtons from "@/components/admin/AdminPostShareButtons";

const AdminLayout: any =
  (AdminLayoutModule as any).default || (AdminLayoutModule as any).AdminLayout;

const cardStyle: CSSProperties = {
  background: "#ffffff",
  padding: "20px",
  borderRadius: "14px",
  border: "1px solid #e5e7eb",
};

const actionButtonStyle: CSSProperties = {
  padding: "8px 14px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  background: "#ffffff",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "14px",
};

const primaryButtonStyle: CSSProperties = {
  ...actionButtonStyle,
  borderColor: "#2563eb",
  background: "#2563eb",
  color: "#ffffff",
};

const savedItemStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
  padding: "16px",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
};

const savedTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "16px",
  lineHeight: 1.4,
  fontWeight: 700,
  color: "#111827",
};

const savedMetaStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: "14px",
  color: "#6b7280",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  alignItems: "center",
};

const viewButtonStyle: CSSProperties = {
  borderRadius: "8px",
  background: "#ecfdf5",
  padding: "8px 14px",
  fontSize: "14px",
  fontWeight: 700,
  color: "#16a34a",
  textDecoration: "none",
};

const editButtonStyle: CSSProperties = {
  borderRadius: "8px",
  background: "#f3f4f6",
  padding: "8px 14px",
  fontSize: "14px",
  fontWeight: 700,
  color: "#374151",
  textDecoration: "none",
};

const deleteButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: "8px",
  background: "#fef2f2",
  padding: "8px 14px",
  fontSize: "14px",
  fontWeight: 700,
  color: "#dc2626",
  cursor: "pointer",
};

type SchemePost = {
  id: string;
  title?: string;
  schemeName?: string;
  department?: string;
  category?: string;
  schemeCategory?: string;
  schemeCategorySlug?: string;
  createdAt?: any;
};

type SchemeCategory = {
  id: string;
  categoryName: string;
  slug: string;
  createdAt?: any;
};

function makeSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminSchemesPage() {
  const [schemes, setSchemes] = useState<SchemePost[]>([]);
  const [categories, setCategories] = useState<SchemeCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [categorySaving, setCategorySaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [deletingCategoryId, setDeletingCategoryId] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSchemes = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();
    if (!queryText) return schemes;

    return schemes.filter((scheme) =>
      [
        scheme.schemeName,
        scheme.title,
        scheme.department,
        scheme.schemeCategory,
        scheme.schemeCategorySlug,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(queryText)
    );
  }, [schemes, searchQuery]);

  const loadSchemesAndCategories = async () => {
    try {
      setLoading(true);

      const [snapshot, managedSchemeCategories] = await Promise.all([
        getDocs(collection(db, "posts")),
        getActiveAdminSubCategories("schemes"),
      ]);

      const allItems = snapshot.docs.map((docItem) => {
        const data = docItem.data();

        return {
          id: docItem.id,
          ...data,
        } as any;
      });

      const schemeList: SchemePost[] = allItems
        .filter((item) => item.category === "schemes")
        .map((item) => ({
          id: item.id,
          title: item.title || "",
          schemeName: item.schemeName || item.title || "",
          department: item.department || "",
          category: item.category || "",
          schemeCategory: item.schemeCategory || "Government Schemes",
          schemeCategorySlug:
            item.schemeCategorySlug || makeSlug(item.schemeCategory || "Government Schemes"),
          createdAt: item.createdAt || null,
        }))
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

      const postCategoryList: SchemeCategory[] = allItems
        .filter(
          (item) =>
            item.category === "scheme-category" &&
            item.type === "scheme-category"
        )
        .map((item) => ({
          id: item.id,
          categoryName: item.categoryName || item.title || "",
          slug: item.slug || makeSlug(item.categoryName || item.title || ""),
          createdAt: item.createdAt || null,
        }))
        .filter((item) => item.categoryName && item.slug)
        .sort((a, b) => a.categoryName.localeCompare(b.categoryName));

      const managedCategoryList: SchemeCategory[] = managedSchemeCategories.map((item) => ({
        id: `managed-${item.id}`,
        categoryName: item.label,
        slug: item.value,
        createdAt: null,
      }));

      const uniqueCategoryMap = new Map<string, SchemeCategory>();
      [...postCategoryList, ...managedCategoryList].forEach((item) => {
        const key = item.slug.toLowerCase();
        if (!uniqueCategoryMap.has(key)) {
          uniqueCategoryMap.set(key, item);
        }
      });

      const categoryList = Array.from(uniqueCategoryMap.values()).sort((a, b) =>
        a.categoryName.localeCompare(b.categoryName)
      );

      setSchemes(schemeList);
      setCategories(categoryList);
    } catch (error) {
      console.error(error);
      alert("Failed to load schemes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = newCategoryName.trim();

    if (!cleanName) {
      alert("Please enter category name");
      return;
    }

    const slug = makeSlug(cleanName);

    if (!slug) {
      alert("Please enter a valid category name");
      return;
    }

    const duplicate = categories.some(
      (item) => item.slug === slug || item.categoryName.toLowerCase() === cleanName.toLowerCase()
    );

    if (duplicate) {
      alert("This category already exists");
      return;
    }

    try {
      setCategorySaving(true);

      await addDoc(collection(db, "posts"), {
        title: cleanName,
        categoryName: cleanName,
        slug,
        category: "scheme-category",
        type: "scheme-category",
        published: false,
        hidden: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Category added successfully");
      setNewCategoryName("");
      await loadSchemesAndCategories();
    } catch (error) {
      console.error(error);
      alert("Failed to add category");
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (categoryItem: SchemeCategory) => {
    if (categoryItem.id.startsWith("managed-")) {
      alert("This category is managed from Admin → Sub Categories. Edit or delete it there. Existing public pages remain unchanged.");
      return;
    }

    const usedInPosts = schemes.some(
      (scheme) => scheme.schemeCategorySlug === categoryItem.slug
    );

    if (usedInPosts) {
      alert(
        "This category is used in existing scheme posts. Please edit or delete those posts first."
      );
      return;
    }

    const confirmDelete = window.confirm(
      `Delete this category?\n\n${categoryItem.categoryName}`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingCategoryId(categoryItem.id);

      await deleteDoc(doc(db, "posts", categoryItem.id));

      alert("Category deleted successfully");

      await loadSchemesAndCategories();
    } catch (error) {
      console.error(error);
      alert("Failed to delete category");
    } finally {
      setDeletingCategoryId("");
    }
  };

  const handleDelete = async (schemeId: string, schemeName: string) => {
    const confirmDelete = window.confirm(`Delete this scheme?\n\n${schemeName}`);

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(schemeId);

      await deleteDoc(doc(db, "posts", schemeId));

      alert("Scheme deleted successfully");

      await loadSchemesAndCategories();
    } catch (error) {
      console.error(error);
      alert("Failed to delete scheme");
    } finally {
      setDeletingId("");
    }
  };

  useEffect(() => {
    loadSchemesAndCategories();
  }, []);

  return (
    <AdminLayout>
      <div style={{ display: "grid", gap: "24px" }}>
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
            <h1 style={{ margin: "0 0 6px" }}>Schemes</h1>
            <p style={{ margin: 0, color: "#64748b" }}>
              Saved schemes first. Use Create New Scheme only when needed.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setShowCategoryManager((oldValue) => !oldValue)}
              style={{
                ...actionButtonStyle,
                background: showCategoryManager ? "#f3f4f6" : "#ffffff",
              }}
            >
              {showCategoryManager ? "Hide Categories" : "Scheme Categories"}
            </button>

            <button
              type="button"
              onClick={() => setShowCreateForm((oldValue) => !oldValue)}
              style={{
                ...primaryButtonStyle,
                background: showCreateForm ? "#f3f4f6" : "#2563eb",
                color: showCreateForm ? "#111827" : "#ffffff",
              }}
            >
              {showCreateForm ? "Hide Form" : "+ Create New Scheme"}
            </button>
          </div>
        </div>

        {showCategoryManager ? (
        <div style={cardStyle}>
          <h2 style={{ margin: 0 }}>Scheme Categories</h2>
          <p style={{ color: "#6b7280", marginTop: "4px" }}>
            Add or delete categories like Scholarships, Farmer Schemes, Student
            Schemes, Women Schemes, Pension Schemes etc.
          </p>

          <form
            onSubmit={handleAddCategory}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "10px",
              marginTop: "16px",
            }}
          >
            <input
              type="text"
              placeholder="Example: Scholarships"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
              }}
            />

            <button
              type="submit"
              disabled={categorySaving}
              style={{
                ...primaryButtonStyle,
                padding: "10px 14px",
              }}
            >
              {categorySaving ? "Adding..." : "Add Category"}
            </button>
          </form>

          <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
            {categories.length === 0 ? (
              <p style={{ color: "#6b7280", margin: 0 }}>
                No categories added yet. Create your first category before
                adding scheme posts.
              </p>
            ) : (
              categories.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                      padding: "16px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "12px",
                  }}
                >
                  <div>
                    <strong>{item.categoryName}</strong>
                    <p style={{ margin: "4px 0 0", color: "#6b7280" }}>
                      Slug: {item.slug}
                      {item.id.startsWith("managed-") ? " • Managed in Sub Categories" : ""}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={deletingCategoryId === item.id || item.id.startsWith("managed-")}
                    onClick={() => handleDeleteCategory(item)}
                    style={{
                      ...deleteButtonStyle,
                      cursor: item.id.startsWith("managed-") ? "not-allowed" : "pointer",
                    }}
                  >
                    {item.id.startsWith("managed-") ? "Managed" : deletingCategoryId === item.id ? "..." : "Delete"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        ) : null}

        {showCreateForm ? (
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 16px" }}>Create New Scheme</h2>
          <SchemeForm
            categories={categories}
            onSaved={() => {
              setShowCreateForm(false);
              loadSchemesAndCategories();
            }}
          />
        </div>
        ) : null}

        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Saved Schemes</h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
                {schemes.length} posts saved
              </p>
            </div>

            <div style={actionRowStyle}>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search saved schemes"
              aria-label="Search saved schemes"
              style={{
                width: "min(260px, 100%)",
                minHeight: "38px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                padding: "8px 10px",
                color: "#111827",
                background: "#ffffff",
              }}
            />
            <button
              type="button"
              onClick={loadSchemesAndCategories}
              style={actionButtonStyle}
            >
              Refresh
            </button>
            </div>
          </div>

          {loading ? (
            <p>Loading schemes...</p>
          ) : schemes.length === 0 ? (
            <p>No schemes found.</p>
          ) : filteredSchemes.length === 0 ? (
            <p>No matching schemes found.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {filteredSchemes.map((scheme) => {
                const name =
                  scheme.schemeName || scheme.title || "Untitled Scheme";

                return (
                  <div key={scheme.id} style={savedItemStyle}>
                    <div style={{ minWidth: 0, flex: "1 1 360px" }}>
                      <h3 style={savedTitleStyle}>{name}</h3>
                      <p style={savedMetaStyle}>
                        {scheme.department || "Department not added"} |{" "}
                        {scheme.schemeCategory || "Government Schemes"}
                      </p>
                    </div>

                    <div style={actionRowStyle}>
                      <Link
                        href={`/schemes/${scheme.id}`}
                        target="_blank"
                        style={viewButtonStyle}
                      >
                        View
                      </Link>

                      <Link
                        href={`/admin/schemes/edit/${scheme.id}`}
                        style={editButtonStyle}
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        disabled={deletingId === scheme.id}
                        onClick={() => handleDelete(scheme.id, name)}
                        style={{
                          ...deleteButtonStyle,
                          cursor:
                            deletingId === scheme.id
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {deletingId === scheme.id ? "..." : "Delete"}
                      </button>

                      <AdminPostShareButtons
                        title={name || "Odisha Sathi Scheme Update"}
                        publicPath={`/schemes/${scheme.id}`}
                        description={scheme.department || scheme.schemeCategory || ""}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
