"use client";

import { FormEvent, useState } from "react";
import type { CSSProperties } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

const RESULT_SUB_CATEGORIES = [
  "Board Results",
  "University Results",
  "Entrance Results",
  "Recruitment Results",
  "Scholarship Results",
  "Admit Card Updates",
  "Answer Key",
  "Merit List",
];

function makeSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  fontSize: "14px",
  outline: "none",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: "vertical",
  lineHeight: 1.55,
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

const checkboxGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const checkboxStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
  color: "#111827",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
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

export function ResultForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleSubCategory = (value: string) => {
    setSubCategories((oldItems) =>
      oldItems.includes(value)
        ? oldItems.filter((item) => item !== value)
        : [...oldItems, value]
    );
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter result title");
      return;
    }

    if (!content.trim()) {
      alert("Please enter result details");
      return;
    }

    if (subCategories.length === 0) {
      alert("Please select at least one result subcategory");
      return;
    }

    try {
      setSaving(true);

      const slug = makeSlug(title);

      await addDoc(collection(db, "posts"), {
        title: title.trim(),
        slug,
        content: content.trim(),
        category: "results",
        subCategories: [...subCategories],
        status: "published",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Result saved successfully");

      setTitle("");
      setContent("");
      setSubCategories([]);
    } catch (error) {
      console.error(error);
      alert("Failed to save result");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Basic Information</h3>

        <label style={labelStyle}>Result Title</label>
        <input
          type="text"
          placeholder="Enter result title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Result Details</h3>

        <label style={labelStyle}>Full Details</label>
        <textarea
          placeholder="Enter result details"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          style={textareaStyle}
        />
      </section>

      <section style={cardStyle}>
        <h3 style={sectionTitleStyle}>Result Subcategories</h3>

        <div style={checkboxGridStyle}>
          {RESULT_SUB_CATEGORIES.map((item) => (
            <label
              key={item}
              style={{
                ...checkboxStyle,
                border: subCategories.includes(item)
                  ? "1px solid #2563eb"
                  : checkboxStyle.border,
                background: subCategories.includes(item)
                  ? "#eff6ff"
                  : "#ffffff",
              }}
            >
              <input
                type="checkbox"
                checked={subCategories.includes(item)}
                onChange={() => toggleSubCategory(item)}
              />
              {item}
            </label>
          ))}
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        style={submitButtonStyle}
      >
        {saving ? "Saving..." : "Save Result"}
      </button>
    </form>
  );
}

export default ResultForm;
