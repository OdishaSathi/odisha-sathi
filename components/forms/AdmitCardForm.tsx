"use client";

import { FormEvent, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

const ADMIT_CARD_SUB_CATEGORIES = [
  "Recruitment Admit Cards",
  "Entrance Admit Cards",
  "Board Admit Cards",
  "University Admit Cards",
  "School Admit Cards",
  "Exam City Intimation",
  "Hall Tickets",
  "Other Admit Cards",
];

function makeSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdmitCardForm() {
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
      alert("Please enter admit card title");
      return;
    }

    if (!content.trim()) {
      alert("Please enter admit card details");
      return;
    }

    if (subCategories.length === 0) {
      alert("Please select at least one admit card subcategory");
      return;
    }

    try {
      setSaving(true);

      const slug = makeSlug(title);

      await addDoc(collection(db, "posts"), {
        title: title.trim(),
        slug,
        content: content.trim(),
        category: "admit-cards",
        subCategories: [...subCategories],
        status: "published",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Admit card saved successfully");

      setTitle("");
      setContent("");
      setSubCategories([]);
    } catch (error) {
      console.error(error);
      alert("Failed to save admit card");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
      <div>
        <label>Admit Card Title</label>
        <input
          type="text"
          placeholder="Enter admit card title"
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
        <label>Admit Card Details</label>
        <textarea
          placeholder="Enter admit card details"
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
        <label>Admit Card Subcategories</label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
            marginTop: "8px",
          }}
        >
          {ADMIT_CARD_SUB_CATEGORIES.map((item) => (
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
        {saving ? "Saving..." : "Save Admit Card"}
      </button>
    </form>
  );
}

export default AdmitCardForm;