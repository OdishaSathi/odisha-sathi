"use client";

import { FormEvent, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

function makeSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function SchemeForm() {
  const [schemeName, setSchemeName] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [officialSite, setOfficialSite] = useState("");
  const [officialPdf, setOfficialPdf] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!schemeName.trim()) {
      alert("Please enter scheme name");
      return;
    }

    if (!department.trim()) {
      alert("Please enter department name");
      return;
    }

    if (!description.trim()) {
      alert("Please enter scheme description");
      return;
    }

    if (!officialSite.trim()) {
      alert("Please enter official site link");
      return;
    }

    if (!officialPdf.trim()) {
      alert("Please enter official PDF link");
      return;
    }

    try {
      setSaving(true);

      const slug = makeSlug(schemeName);

      await addDoc(collection(db, "posts"), {
        title: schemeName.trim(),
        slug,
        category: "schemes",
        schemeName: schemeName.trim(),
        department: department.trim(),
        description: description.trim(),
        content: description.trim(),
        officialSite: officialSite.trim(),
        officialPdf: officialPdf.trim(),
        status: "published",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Scheme saved successfully");

      setSchemeName("");
      setDepartment("");
      setDescription("");
      setOfficialSite("");
      setOfficialPdf("");
    } catch (error) {
      console.error(error);
      alert("Failed to save scheme");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
      <div>
        <label>Scheme Name</label>
        <input
          type="text"
          placeholder="Example: Subhadra Yojana"
          value={schemeName}
          onChange={(e) => setSchemeName(e.target.value)}
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
        <label>Department</label>
        <input
          type="text"
          placeholder="Example: Women and Child Development Department"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
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
        <label>Scheme Description</label>
        <textarea
          placeholder="Enter full scheme details"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
        <label>Official Site Link</label>
        <input
          type="url"
          placeholder="https://example.gov.in"
          value={officialSite}
          onChange={(e) => setOfficialSite(e.target.value)}
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
        <label>Official PDF Link</label>
        <input
          type="url"
          placeholder="https://example.gov.in/scheme.pdf"
          value={officialPdf}
          onChange={(e) => setOfficialPdf(e.target.value)}
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
        {saving ? "Saving..." : "Save Scheme"}
      </button>
    </form>
  );
}

export default SchemeForm;