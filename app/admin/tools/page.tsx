"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import ToolForm from "../../../components/forms/ToolForm";
import * as AdminLayoutModule from "../../../components/admin/AdminLayout";

const AdminLayout: any =
  (AdminLayoutModule as any).default || (AdminLayoutModule as any).AdminLayout;

type ToolPost = {
  id: string;
  title?: string;
  category?: string;
  toolCategory?: string;
  toolName?: string;
  toolUrl?: string;
  createdAt?: any;
};

function getToolCategoryLabel(value?: string) {
  if (value === "pdf-tools") return "PDF Tools";
  if (value === "image-tools") return "Image Tools";
  return "Uncategorized";
}

export default function AdminToolsPage() {
  const [tools, setTools] = useState<ToolPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

  async function loadTools() {
    try {
      setLoading(true);

      const snapshot = await getDocs(collection(db, "posts"));

      const list: ToolPost[] = snapshot.docs
        .map((docItem) => {
          const data = docItem.data();

          return {
            id: docItem.id,
            title: data.title || "",
            category: data.category || "",
            toolCategory: data.toolCategory || "pdf-tools",
            toolName: data.toolName || data.title || "",
            toolUrl: data.toolUrl || "",
            createdAt: data.createdAt || null,
          };
        })
        .filter((item) => item.category === "tools")
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });

      setTools(list);
    } catch (error) {
      console.error(error);
      alert("Failed to load tools");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    const confirmDelete = window.confirm(`Delete this tool?\n\n${name}`);

    if (!confirmDelete) return;

    try {
      setDeletingId(id);

      await deleteDoc(doc(db, "posts", id));

      alert("Tool deleted successfully");

      await loadTools();
    } catch (error) {
      console.error(error);
      alert("Failed to delete tool");
    } finally {
      setDeletingId("");
    }
  }

  useEffect(() => {
    loadTools();
  }, []);

  return (
    <AdminLayout>
      <div style={{ display: "grid", gap: "24px" }}>
        <div>
          <h1>Tools</h1>
          <p>Manage PDF tools and image tools external links.</p>
        </div>

        <div
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2>Create New Tool</h2>
          <ToolForm />
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
              gap: "12px",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2>Saved Tools</h2>

            <button
              type="button"
              onClick={loadTools}
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
            <p>Loading tools...</p>
          ) : tools.length === 0 ? (
            <p>No tools found.</p>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {tools.map((tool) => {
                const name = tool.toolName || tool.title || "Untitled Tool";

                return (
                  <div
                    key={tool.id}
                    style={{
                      padding: "14px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      display: "grid",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "4px 8px",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: "700",
                          marginBottom: "8px",
                        }}
                      >
                        {getToolCategoryLabel(tool.toolCategory)}
                      </span>

                      <h3 style={{ margin: 0 }}>{name}</h3>

                      <p
                        style={{
                          margin: "6px 0 0",
                          color: "#4b5563",
                          wordBreak: "break-all",
                        }}
                      >
                        {tool.toolUrl}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "74px 74px 74px",
                        gap: "10px",
                        width: "fit-content",
                      }}
                    >
                      <a
                        href={tool.toolUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
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
                      </a>

                      <Link
                        href={`/admin/tools/edit/${tool.id}`}
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
                        disabled={deletingId === tool.id}
                        onClick={() => handleDelete(tool.id, name)}
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
                        {deletingId === tool.id ? "..." : "Delete"}
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