"use client";

import { FormEvent, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

const TOOL_CATEGORIES = [
  { label: "PDF Tools", value: "pdf-tools" },
  { label: "Image Tools", value: "image-tools" },
];

function normalizeUrl(url: string) {
  const cleanUrl = url.trim();

  if (!cleanUrl) return "";

  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }

  return `https://${cleanUrl}`;
}

export default function EditToolForm() {
  const router = useRouter();
  const params = useParams();

  const toolId = typeof params?.id === "string" ? params.id : "";

  const [toolCategory, setToolCategory] = useState("pdf-tools");
  const [toolName, setToolName] = useState("");
  const [toolUrl, setToolUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadTool() {
      if (!toolId) {
        alert("Tool ID not found");
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "posts", toolId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          alert("Tool not found");
          setLoading(false);
          return;
        }

        const data = snap.data();

        setToolCategory(data.toolCategory || "pdf-tools");
        setToolName(data.toolName || data.title || "");
        setToolUrl(data.toolUrl || "");
      } catch (error) {
        console.error(error);
        alert("Failed to load tool");
      } finally {
        setLoading(false);
      }
    }

    loadTool();
  }, [toolId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!toolId) {
      alert("Tool ID not found");
      return;
    }

    if (!toolCategory.trim()) {
      alert("Please select tool category");
      return;
    }

    if (!toolName.trim()) {
      alert("Please enter tool name");
      return;
    }

    if (!toolUrl.trim()) {
      alert("Please enter tool link");
      return;
    }

    try {
      setSaving(true);

      await updateDoc(doc(db, "posts", toolId), {
        title: toolName.trim(),
        category: "tools",
        toolCategory,
        toolName: toolName.trim(),
        toolUrl: normalizeUrl(toolUrl),
        updatedAt: serverTimestamp(),
      });

      alert("Tool updated successfully");

      router.push("/admin/tools");
    } catch (error) {
      console.error(error);
      alert("Failed to update tool");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Loading tool...</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Tool Information</h3>

        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Tool Category</label>
            <select
              value={toolCategory}
              onChange={(e) => setToolCategory(e.target.value)}
              style={inputStyle}
            >
              {TOOL_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Tool Name</label>
            <input
              type="text"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Tool Website Link</label>
            <input
              type="text"
              value={toolUrl}
              onChange={(e) => setToolUrl(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      <button type="submit" disabled={saving} style={submitButtonStyle}>
        {saving ? "Updating..." : "Update Tool"}
      </button>
    </form>
  );
}

const formStyle: CSSProperties = {
  display: "grid",
  gap: "22px",
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
  background: "#ffffff",
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
  margin: "0 0 14px",
  fontSize: "17px",
  fontWeight: 700,
  color: "#111827",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
};

const submitButtonStyle: CSSProperties = {
  padding: "12px 16px",
  border: "none",
  borderRadius: "8px",
  background: "#2563eb",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: 700,
  cursor: "pointer",
};
