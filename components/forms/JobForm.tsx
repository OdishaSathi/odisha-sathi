"use client";

import { FormEvent, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

const JOB_SUB_CATEGORIES = [
  "Odisha Jobs",
  "Central Jobs",
  "Apprenticeship",
  "10th Jobs",
  "ITI Jobs",
  "Diploma Jobs",
  "+2 Jobs",
  "+3 Jobs",
  "Technical Graduate Jobs",
  "Post Graduate Jobs",
];

function makeSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function JobForm() {
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
      alert("Please enter job title");
      return;
    }

    if (!content.trim()) {
      alert("Please enter job details");
      return;
    }

    if (subCategories.length === 0) {
      alert("Please select at least one job subcategory");
      return;
    }

    try {
      setSaving(true);

      const slug = makeSlug(title);

      await addDoc(collection(db, "posts"), {
        title: title.trim(),
        slug,
        content: content.trim(),
        category: "jobs",
        subCategories: [...subCategories],
        status: "published",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Job saved successfully");

      setTitle("");
      setContent("");
      setSubCategories([]);
    } catch (error) {
      console.error(error);
      alert("Failed to save job");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
      <div>
        <label>Job Title</label>
        <input
          type="text"
          placeholder="Enter job title"
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
        <label>Job Details</label>
        <textarea
          placeholder="Enter job details"
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
        <label>Job Subcategories</label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
            marginTop: "8px",
          }}
        >
          {JOB_SUB_CATEGORIES.map((item) => (
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
        {saving ? "Saving..." : "Save Job"}
      </button>
    </form>
  );
}

export default JobForm;