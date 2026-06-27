"use client";

import { FormEvent, useEffect, useState } from "react";
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
        setContent(data.content || "");

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

      await updateDoc(doc(db, "posts", routeId), {
        title: title.trim(),
        slug,
        content: content.trim(),
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
        {saving ? "Updating..." : "Update Result"}
      </button>
    </form>
  );
}

export default EditResultForm;