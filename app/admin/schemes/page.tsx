"use client";

import { FormEvent, useEffect, useState } from "react";
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
import * as AdminLayoutModule from "../../../components/admin/AdminLayout";

const AdminLayout: any =
  (AdminLayoutModule as any).default || (AdminLayoutModule as any).AdminLayout;

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

  const loadSchemesAndCategories = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "posts"));

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

      const categoryList: SchemeCategory[] = allItems
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
        <div>
          <h1>Schemes</h1>
          <p>
            Create and manage government schemes, scholarships and other scheme
            categories here.
          </p>
        </div>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2>Scheme Categories</h2>
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
                padding: "12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            />

            <button
              type="submit"
              disabled={categorySaving}
              style={{
                padding: "12px 16px",
                border: "none",
                borderRadius: "8px",
                background: "#2563eb",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
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
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                  }}
                >
                  <div>
                    <strong>{item.categoryName}</strong>
                    <p style={{ margin: "4px 0 0", color: "#6b7280" }}>
                      Slug: {item.slug}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={deletingCategoryId === item.id}
                    onClick={() => handleDeleteCategory(item)}
                    style={{
                      padding: "8px 12px",
                      border: "none",
                      borderRadius: "8px",
                      background: "#fee2e2",
                      color: "#dc2626",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    {deletingCategoryId === item.id ? "..." : "Delete"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2>Create New Scheme</h2>
          <SchemeForm
            categories={categories}
            onSaved={loadSchemesAndCategories}
          />
        </div>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <h2>Saved Schemes</h2>

            <button
              type="button"
              onClick={loadSchemesAndCategories}
              style={{
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                background: "white",
                cursor: "pointer",
              }}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Loading schemes...</p>
          ) : schemes.length === 0 ? (
            <p>No schemes found.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {schemes.map((scheme) => {
                const name =
                  scheme.schemeName || scheme.title || "Untitled Scheme";

                return (
                  <div
                    key={scheme.id}
                    style={{
                      padding: "14px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      display: "grid",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0 }}>{name}</h3>
                      <p style={{ margin: "6px 0 0", color: "#4b5563" }}>
                        {scheme.department || "Department not added"}
                      </p>
                      <p style={{ margin: "6px 0 0", color: "#2563eb" }}>
                        Category:{" "}
                        {scheme.schemeCategory || "Government Schemes"}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "74px 74px 74px",
                        gap: "10px",
                        alignItems: "center",
                        width: "fit-content",
                      }}
                    >
                      <Link
                        href={`/schemes/${scheme.id}`}
                        target="_blank"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "74px",
                          height: "36px",
                          background: "#16a34a",
                          color: "white",
                          borderRadius: "8px",
                          textDecoration: "none",
                          fontSize: "14px",
                        }}
                      >
                        View
                      </Link>

                      <Link
                        href={`/admin/schemes/edit/${scheme.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "74px",
                          height: "36px",
                          background: "#2563eb",
                          color: "white",
                          borderRadius: "8px",
                          textDecoration: "none",
                          fontSize: "14px",
                        }}
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        disabled={deletingId === scheme.id}
                        onClick={() => handleDelete(scheme.id, name)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "74px",
                          height: "36px",
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        {deletingId === scheme.id ? "..." : "Delete"}
                      </button>
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