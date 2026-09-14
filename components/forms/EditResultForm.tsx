"use client";

import { FormEvent, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
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

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
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

type EditResultFormProps = {
  id?: string;
  postId?: string;
};

export function EditResultForm({ id, postId }: EditResultFormProps) {
  const router = useRouter();
  const params = useParams();

  const routeId =
    id ||
    postId ||
    (typeof params?.id === "string" ? params.id : "") ||
    (typeof params?.postId === "string" ? params.postId : "");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeUrl2, setYoutubeUrl2] = useState("");
  const [youtubeUrl3, setYoutubeUrl3] = useState("");
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const toggleSubCategory = (value: string) => {
    setSubCategories((oldItems) =>
      oldItems.includes(value)
        ? oldItems.filter((item) => item !== value)
        : [...oldItems, value]
    );
  };

  useEffect(() => {
    const loadResult = async () => {
      if (!routeId) {
        alert("Result ID not found");
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "posts", routeId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          alert("Result not found");
          setLoading(false);
          return;
        }

        const data = snap.data();

        setTitle(data.title || "");
        setContent(data.content || data.description || "");

        const savedYoutubeUrls = Array.isArray(data.youtubeUrls)
          ? data.youtubeUrls
          : [];

        setYoutubeUrl(data.youtubeUrl || "");
        setYoutubeUrl2(savedYoutubeUrls[0] || data.youtubeUrl2 || data.videoUrl2 || "");
        setYoutubeUrl3(savedYoutubeUrls[1] || data.youtubeUrl3 || data.videoUrl3 || "");

        if (Array.isArray(data.subCategories)) {
          setSubCategories(data.subCategories);
        } else if (data.subCategory) {
          setSubCategories([data.subCategory]);
        } else {
          setSubCategories([]);
        }
      } catch (error) {
        console.error(error);
        alert("Failed to load result");
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [routeId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!routeId) {
      alert("Result ID not found");
      return;
    }

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

      const cleanedYoutubeUrls = [youtubeUrl2, youtubeUrl3]
        .map((item) => item.trim())
        .filter(Boolean);

      await updateDoc(doc(db, "posts", routeId), {
        title: title.trim(),
        slug,
        content: content.trim(),
        description: content.trim(),
        youtubeUrl: youtubeUrl.trim(),
        youtubeUrls: cleanedYoutubeUrls,
        category: "results",
        subCategories: [...subCategories],
        updatedAt: serverTimestamp(),
      });

      alert("Result updated successfully");

      router.push("/admin/results");
    } catch (error) {
      console.error(error);
      alert("Failed to update result");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading result...</p>;
  }

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
        <h3 style={sectionTitleStyle}>Media</h3>

        <div style={gridStyle}>
        <div>
          <label style={labelStyle}>YouTube Video 1</label>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>YouTube Video 2</label>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl2}
            onChange={(e) => setYoutubeUrl2(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>YouTube Video 3</label>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl3}
            onChange={(e) => setYoutubeUrl3(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>
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
        {saving ? "Updating..." : "Update Result"}
      </button>
    </form>
  );
}

export default EditResultForm;
