"use client";

import { FormEvent, useEffect, useState } from "react";
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
        {saving ? "Updating..." : "Update Tool"}
      </button>
    </form>
  );
}