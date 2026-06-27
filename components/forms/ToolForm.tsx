"use client";

import { FormEvent, useState } from "react";
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
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
      <div>
        <label>Tool Category</label>
        <select
          value={toolCategory}
          onChange={(e) => setToolCategory(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "6px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            background: "white",
          }}
        >
          {TOOL_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Tool Name</label>
        <input
          type="text"
          placeholder="Example: Compress PDF"
          value={toolName}
          onChange={(e) => setToolName(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "6px",
            border: "1px solid #ddd",
            borderRadius: "8px",
          }}
        />
      </div>

      <div>
        <label>Tool Website Link</label>
        <input
          type="text"
          placeholder="Example: https://www.ilovepdf.com/compress_pdf"
          value={toolUrl}
          onChange={(e) => setToolUrl(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "6px",
            border: "1px solid #ddd",
            borderRadius: "8px",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        style={{
          padding: "12px",
          border: "none",
          borderRadius: "8px",
          background: "#2563eb",
          color: "white",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {saving ? "Saving..." : "Save Tool"}
      </button>
    </form>
  );
}