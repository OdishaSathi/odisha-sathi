"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const jobSubCategories = [
  "10th Pass Jobs",
  "+2 Jobs",
  "ITI Jobs",
  "Diploma Jobs",
  "Degree Jobs",
  "Govt Jobs",
  "Private Jobs",
  "Odisha Jobs",
  "Central Jobs",
];

export default function AdminPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const makeSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const toggleSubCategory = (name: string) => {
    setSubCategories((prev) => {
      if (prev.includes(name)) {
        return prev.filter((item) => item !== name);
      }
      return [...prev, name];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter job title.");
      return;
    }

    if (!content.trim()) {
      alert("Please enter job details.");
      return;
    }

    if (subCategories.length === 0) {
      alert("Please select at least one job sub category.");
      return;
    }

    setLoading(true);

    await addDoc(collection(db, "posts"), {
      title: title.trim(),
      slug: makeSlug(title),
      content: content.trim(),
      category: "jobs",
      subCategories: [...subCategories],
      createdAt: serverTimestamp(),
    });

    setTitle("");
    setContent("");
    setSubCategories([]);
    setLoading(false);

    alert("Post saved successfully");
  };

  return (
    <main style={{ maxWidth: "700px", margin: "30px auto", padding: "20px" }}>
      <h1>Easy Admin Form</h1>

      <form onSubmit={handleSubmit}>
        <label>Job Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "15px" }}
        />

        <label>Select Job Sub Categories</label>
        <div style={{ margin: "10px 0 20px" }}>
          {jobSubCategories.map((item) => (
            <label key={item} style={{ display: "block", marginBottom: "8px" }}>
              <input
                type="checkbox"
                checked={subCategories.includes(item)}
                onChange={() => toggleSubCategory(item)}
                style={{ marginRight: "8px" }}
              />
              {item}
            </label>
          ))}
        </div>

        <label>Job Details</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          style={{ width: "100%", padding: "10px", marginBottom: "15px" }}
        />

        <button type="submit" disabled={loading} style={{ padding: "12px 20px" }}>
          {loading ? "Saving..." : "Save Job Post"}
        </button>
      </form>
    </main>
  );
}