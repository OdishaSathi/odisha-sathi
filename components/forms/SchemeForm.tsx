"use client";

import { FormEvent, useState } from "react";
import type { CSSProperties } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { buildAdminPostMetadata } from "@/lib/adminPostMetadata";

type SchemeCategory = {
  id: string;
  categoryName: string;
  slug: string;
};

type SchemeFormProps = {
  categories?: SchemeCategory[];
  onSaved?: () => void | Promise<void>;
};

function makeSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const fieldStyle: CSSProperties = {
  width: "100%",
  padding: "12px",
  marginTop: "6px",
  border: "1px solid #ddd",
  borderRadius: "8px",
};

export function SchemeForm({ categories = [], onSaved }: SchemeFormProps) {
  const [schemeCategorySlug, setSchemeCategorySlug] = useState("");
  const [schemeName, setSchemeName] = useState("");
  const [department, setDepartment] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [benefit, setBenefit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startDateDisplay, setStartDateDisplay] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [lastDateDisplay, setLastDateDisplay] = useState("");
  const [description, setDescription] = useState("");
  const [officialSite, setOfficialSite] = useState("");
  const [officialPdf, setOfficialPdf] = useState("");
  const [applyLink, setApplyLink] = useState("");
  const [notificationLink, setNotificationLink] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeUrl2, setYoutubeUrl2] = useState("");
  const [youtubeUrl3, setYoutubeUrl3] = useState("");
  const [schemeStatus, setSchemeStatus] = useState("active");
  const [saving, setSaving] = useState(false);

  const selectedCategory = categories.find(
    (item) => item.slug === schemeCategorySlug
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (categories.length === 0) {
      alert("Please create at least one scheme category first");
      return;
    }

    if (!selectedCategory) {
      alert("Please select scheme category");
      return;
    }

    if (!schemeName.trim()) {
      alert("Please enter scheme name");
      return;
    }

    if (!department.trim()) {
      alert("Please enter department / portal name");
      return;
    }

    if (!description.trim()) {
      alert("Please enter description");
      return;
    }

    try {
      setSaving(true);

      const slug = makeSlug(schemeName);

      const importantDates = [
        { label: "Application Start Date", value: startDateDisplay.trim() || startDate },
        { label: "Last Date", value: lastDateDisplay.trim() || lastDate },
      ].filter((item) => item.value);

      const cleanedYoutubeUrls = [youtubeUrl2, youtubeUrl3]
        .map((item) => item.trim())
        .filter(Boolean);

      const importantLinks = [
        { label: "Official Site", url: officialSite.trim() },
        { label: "Official PDF", url: officialPdf.trim() },
        { label: "Apply Online", url: applyLink.trim() },
        { label: "Notification / Guideline", url: notificationLink.trim() },
      ].filter((item) => item.url);

      await addDoc(collection(db, "posts"), {
        title: schemeName.trim(),
        slug,
        category: "schemes",
        type: "schemes",
        schemeCategory: selectedCategory.categoryName,
        schemeCategorySlug: selectedCategory.slug,
        schemeName: schemeName.trim(),
        department: department.trim(),
        eligibility: eligibility.trim(),
        benefit: benefit.trim(),
        startDate,
        startDateDisplay: startDateDisplay.trim(),
        lastDate,
        lastDateDisplay: lastDateDisplay.trim(),
        description: description.trim(),
        content: description.trim(),
        officialSite: officialSite.trim(),
        officialPdf: officialPdf.trim(),
        applyLink: applyLink.trim(),
        notificationLink: notificationLink.trim(),
        youtubeUrl: youtubeUrl.trim(),
        youtubeUrls: cleanedYoutubeUrls,
        status: schemeStatus,
        published: true,
        importantDates,
        importantLinks,
        links: importantLinks,
        ...buildAdminPostMetadata({ importantDates, importantLinks }),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Scheme saved successfully");

      setSchemeCategorySlug("");
      setSchemeName("");
      setDepartment("");
      setEligibility("");
      setBenefit("");
      setStartDate("");
      setStartDateDisplay("");
      setLastDate("");
      setLastDateDisplay("");
      setDescription("");
      setOfficialSite("");
      setOfficialPdf("");
      setApplyLink("");
      setNotificationLink("");
      setYoutubeUrl("");
      setYoutubeUrl2("");
      setYoutubeUrl3("");
      setSchemeStatus("active");

      await onSaved?.();
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
        <label>Scheme Category</label>
        <select
          value={schemeCategorySlug}
          onChange={(e) => setSchemeCategorySlug(e.target.value)}
          style={fieldStyle}
        >
          <option value="">Select category</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.categoryName}
            </option>
          ))}
        </select>

        {categories.length === 0 ? (
          <p style={{ margin: "6px 0 0", color: "#dc2626" }}>
            Please create a category first.
          </p>
        ) : null}
      </div>

      <div>
        <label>Scheme Name</label>
        <input
          type="text"
          placeholder="Example: State Scholarship 2026"
          value={schemeName}
          onChange={(e) => setSchemeName(e.target.value)}
          style={fieldStyle}
        />
      </div>

      <div>
        <label>Department / Portal</label>
        <input
          type="text"
          placeholder="Example: State Scholarship Portal Odisha"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          style={fieldStyle}
        />
      </div>

      <div>
        <label>Eligibility</label>
        <textarea
          placeholder="Enter eligibility details"
          value={eligibility}
          onChange={(e) => setEligibility(e.target.value)}
          rows={4}
          style={{ ...fieldStyle, resize: "vertical" }}
        />
      </div>

      <div>
        <label>Benefit / Amount</label>
        <input
          type="text"
          placeholder="Example: ₹5,000 / Tuition fee support"
          value={benefit}
          onChange={(e) => setBenefit(e.target.value)}
          style={fieldStyle}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
        }}
      >
        <div>
          <label>Application Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={fieldStyle}
          />
          <input
            type="text"
            value={startDateDisplay}
            onChange={(e) => setStartDateDisplay(e.target.value)}
            placeholder="Optional display: July 2026 / Coming Soon"
            style={fieldStyle}
          />
        </div>

        <div>
          <label>Last Date</label>
          <input
            type="date"
            value={lastDate}
            onChange={(e) => setLastDate(e.target.value)}
            style={fieldStyle}
          />
          <input
            type="text"
            value={lastDateDisplay}
            onChange={(e) => setLastDateDisplay(e.target.value)}
            placeholder="Optional display: Expected in July 2026"
            style={fieldStyle}
          />
        </div>
      </div>

      <div>
        <label>Description</label>
        <textarea
          placeholder="Enter full scheme details"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={8}
          style={{ ...fieldStyle, resize: "vertical" }}
        />
      </div>

      <div>
        <label>Official Site Link</label>
        <input
          type="url"
          placeholder="https://example.gov.in"
          value={officialSite}
          onChange={(e) => setOfficialSite(e.target.value)}
          style={fieldStyle}
        />
      </div>

      <div>
        <label>Official PDF / Guideline Link</label>
        <input
          type="url"
          placeholder="https://example.gov.in/scheme.pdf"
          value={officialPdf}
          onChange={(e) => setOfficialPdf(e.target.value)}
          style={fieldStyle}
        />
      </div>

      <div>
        <label>Apply Online Link</label>
        <input
          type="url"
          placeholder="https://example.gov.in/apply"
          value={applyLink}
          onChange={(e) => setApplyLink(e.target.value)}
          style={fieldStyle}
        />
      </div>

      <div>
        <label>Notification / Guideline Link</label>
        <input
          type="url"
          placeholder="https://example.gov.in/notification"
          value={notificationLink}
          onChange={(e) => setNotificationLink(e.target.value)}
          style={fieldStyle}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
        }}
      >
        <div>
          <label>YouTube Video 1</label>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <div>
          <label>YouTube Video 2</label>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl2}
            onChange={(e) => setYoutubeUrl2(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <div>
          <label>YouTube Video 3</label>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl3}
            onChange={(e) => setYoutubeUrl3(e.target.value)}
            style={fieldStyle}
          />
        </div>
      </div>

      <div>
        <label>Status</label>
        <select
          value={schemeStatus}
          onChange={(e) => setSchemeStatus(e.target.value)}
          style={fieldStyle}
        >
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
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