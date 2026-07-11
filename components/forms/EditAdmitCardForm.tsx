"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
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

type EditAdmitCardFormProps = {
  id?: string;
  postId?: string;
};

export function EditAdmitCardForm({ id, postId }: EditAdmitCardFormProps) {
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
    const loadAdmitCard = async () => {
      if (!routeId) {
        alert("Admit card ID not found");
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "posts", routeId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          alert("Admit card not found");
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
        alert("Failed to load admit card");
      } finally {
        setLoading(false);
      }
    };

    loadAdmitCard();
  }, [routeId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!routeId) {
      alert("Admit card ID not found");
      return;
    }

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
        category: "admit-cards",
        subCategories: [...subCategories],
        updatedAt: serverTimestamp(),
      });

      alert("Admit card updated successfully");

      router.push("/admin/admit-cards");
    } catch (error) {
      console.error(error);
      alert("Failed to update admit card");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading admit card...</p>;
  }

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
          <label>YouTube Video 2</label>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl2}
            onChange={(e) => setYoutubeUrl2(e.target.value)}
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
          <label>YouTube Video 3</label>
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={youtubeUrl3}
            onChange={(e) => setYoutubeUrl3(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "6px",
              border: "1px solid #ddd",
              borderRadius: "8px",
            }}
          />
        </div>
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
        {saving ? "Updating..." : "Update Admit Card"}
      </button>
    </form>
  );
}

export default EditAdmitCardForm;