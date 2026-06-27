"use client";

import { FormEvent, useState } from "react";
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
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
      <div>
        <label>Result Title</label>
        <input
          type="text"
          placeholder="Enter result title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
        <label>Result Details</label>
        <textarea
          placeholder="Enter result details"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "6px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            resize: "vertical",
          }}
        />
      </div>

      <div>
        <label>Result Subcategories</label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
            marginTop: "8px",
          }}
        >
          {RESULT_SUB_CATEGORIES.map((item) => (
            <label
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                cursor: "pointer",
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
        {saving ? "Saving..." : "Save Result"}
      </button>
    </form>
  );
}

export default ResultForm;