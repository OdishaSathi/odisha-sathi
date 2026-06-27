"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
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
  createdAt?: any;
};

export default function AdminSchemesPage() {
  const [schemes, setSchemes] = useState<SchemePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

  const loadSchemes = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "posts"));

      const schemeList: SchemePost[] = snapshot.docs
        .map((docItem) => {
          const data = docItem.data();

          return {
            id: docItem.id,
            title: data.title || "",
            schemeName: data.schemeName || data.title || "",
            department: data.department || "",
            category: data.category || "",
            createdAt: data.createdAt || null,
          };
        })
        .filter((item) => item.category === "schemes")
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

      setSchemes(schemeList);
    } catch (error) {
      console.error(error);
      alert("Failed to load schemes");
    } finally {
      setLoading(false);
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

      await loadSchemes();
    } catch (error) {
      console.error(error);
      alert("Failed to delete scheme");
    } finally {
      setDeletingId("");
    }
  };

  useEffect(() => {
    loadSchemes();
  }, []);

  return (
    <AdminLayout>
      <div style={{ display: "grid", gap: "24px" }}>
        <div>
          <h1>Schemes</h1>
          <p>Create and manage government schemes here.</p>
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
          <SchemeForm />
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
              onClick={loadSchemes}
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
                const name = scheme.schemeName || scheme.title || "Untitled Scheme";

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