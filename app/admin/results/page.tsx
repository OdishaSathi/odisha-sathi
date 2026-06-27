"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import ResultForm from "../../../components/forms/ResultForm";
import * as AdminLayoutModule from "../../../components/admin/AdminLayout";

const AdminLayout: any =
  (AdminLayoutModule as any).default || (AdminLayoutModule as any).AdminLayout;

type ResultPost = {
  id: string;
  title: string;
  slug?: string;
  category?: string;
  subCategory?: string;
  subCategories?: string[];
  createdAt?: any;
};

export default function AdminResultsPage() {
  const [results, setResults] = useState<ResultPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

  const loadResults = async () => {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "posts"));

      const resultList: ResultPost[] = snapshot.docs
        .map((docItem) => {
          const data = docItem.data();

          return {
            id: docItem.id,
            title: data.title || "",
            slug: data.slug || "",
            category: data.category || "",
            subCategory: data.subCategory || "",
            subCategories: Array.isArray(data.subCategories)
              ? data.subCategories
              : [],
            createdAt: data.createdAt || null,
          };
        })
        .filter((item) => item.category === "results")
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

      setResults(resultList);
    } catch (error) {
      console.error(error);
      alert("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resultId: string, resultTitle: string) => {
    const confirmDelete = window.confirm(
      `Delete this result?\n\n${resultTitle}`
    );

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(resultId);

      await deleteDoc(doc(db, "posts", resultId));

      alert("Result deleted successfully");

      await loadResults();
    } catch (error) {
      console.error(error);
      alert("Failed to delete result");
    } finally {
      setDeletingId("");
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  return (
    <AdminLayout>
      <div style={{ display: "grid", gap: "24px" }}>
        <div>
          <h1>Results</h1>
          <p>Create and manage result posts here.</p>
        </div>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2>Create New Result</h2>
          <ResultForm />
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
            <h2>Saved Results</h2>

            <button
              type="button"
              onClick={loadResults}
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
            <p>Loading results...</p>
          ) : results.length === 0 ? (
            <p>No results found.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {results.map((result) => {
                const selectedSubCategories =
                  result.subCategories && result.subCategories.length > 0
                    ? result.subCategories
                    : result.subCategory
                    ? [result.subCategory]
                    : [];

                return (
                  <div
                    key={result.id}
                    style={{
                      padding: "14px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      display: "grid",
                      gap: "12px",
                    }}
                  >
                    <h3 style={{ margin: 0 }}>{result.title}</h3>

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
                        href={`/post/${result.slug || result.id}`}
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
                        href={`/admin/results/edit/${result.id}`}
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
                        disabled={deletingId === result.id}
                        onClick={() => handleDelete(result.id, result.title)}
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
                        {deletingId === result.id ? "..." : "Delete"}
                      </button>
                    </div>

                    <div>
                      <strong>Subcategories:</strong>

                      {selectedSubCategories.length === 0 ? (
                        <span> Not selected</span>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                            marginTop: "8px",
                          }}
                        >
                          {selectedSubCategories.map((item) => (
                            <span
                              key={item}
                              style={{
                                padding: "5px 9px",
                                background: "#eff6ff",
                                color: "#1d4ed8",
                                borderRadius: "999px",
                                fontSize: "13px",
                                border: "1px solid #bfdbfe",
                              }}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
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