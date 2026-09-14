"use client";

import { FormEvent, useState } from "react";
import type { CSSProperties } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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

export default function ToolForm() {
  const [toolCategory, setToolCategory] = useState("pdf-tools");
  const [toolName, setToolName] = useState("");
  const [toolUrl, setToolUrl] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

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

      await addDoc(collection(db, "posts"), {
        title: toolName.trim(),
        category: "tools",
        toolCategory,
        toolName: toolName.trim(),
        toolUrl: normalizeUrl(toolUrl),
        status: "published",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Tool saved successfully");

      setToolCategory("pdf-tools");
      setToolName("");
      setToolUrl("");
    } catch (error) {
      console.error(error);
      alert("Failed to save tool");
    } finally {
      setSaving(false);
    }
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
          placeholder="Example: Compress PDF"
          value={toolName}
          onChange={(e) => setToolName(e.target.value)}
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Tool Website Link</label>
        <input
          type="text"
          placeholder="Example: https://www.ilovepdf.com/compress_pdf"
          value={toolUrl}
          onChange={(e) => setToolUrl(e.target.value)}
          style={inputStyle}
        />
      </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        style={submitButtonStyle}
      >
        {saving ? "Saving..." : "Save Tool"}
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
