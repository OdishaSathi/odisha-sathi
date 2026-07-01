"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, getDoc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

function makeSlug(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type SchemeCategory = {
  id: string;
  categoryName: string;
  slug: string;
};

type EditSchemeFormProps = {
  id?: string;
  postId?: string;
};

function fieldStyle() {
  return {
    width: "100%",
    padding: "12px",
    marginTop: "6px",
    border: "1px solid #ddd",
    borderRadius: "8px",
  };
}

export function EditSchemeForm({ id, postId }: EditSchemeFormProps) {
  const router = useRouter();
  const params = useParams();

  const routeId =
    id ||
    postId ||
    (typeof params?.id === "string" ? params.id : "") ||
    (typeof params?.postId === "string" ? params.postId : "");

  const [categories, setCategories] = useState<SchemeCategory[]>([]);
  const [schemeCategorySlug, setSchemeCategorySlug] = useState("");
  const [schemeName, setSchemeName] = useState("");
  const [department, setDepartment] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [benefit, setBenefit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [lastDate, setLastDate] = useState("");
  const [description, setDescription] = useState("");
  const [officialSite, setOfficialSite] = useState("");
  const [officialPdf, setOfficialPdf] = useState("");
  const [applyLink, setApplyLink] = useState("");
  const [notificationLink, setNotificationLink] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [schemeStatus, setSchemeStatus] = useState("active");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadScheme = async () => {
      if (!routeId) {
        alert("Scheme ID not found");
        setLoading(false);
        return;
      }

      try {
        const categorySnapshot = await getDocs(collection(db, "posts"));

        const categoryList: SchemeCategory[] = categorySnapshot.docs
          .map((docItem) => {
            const data = docItem.data();

            return {
              id: docItem.id,
              categoryName: data.categoryName || data.title || "",
              slug: data.slug || makeSlug(data.categoryName || data.title || ""),
              category: data.category || "",
              type: data.type || "",
            };
          })
          .filter(
            (item: any) =>
              item.category === "scheme-category" &&
              item.type === "scheme-category" &&
              item.categoryName &&
              item.slug
          )
          .sort((a, b) => a.categoryName.localeCompare(b.categoryName));

        const ref = doc(db, "posts", routeId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          alert("Scheme not found");
          setLoading(false);
          return;
        }

        const data = snap.data();

        const existingCategoryName = data.schemeCategory || "Government Schemes";
        const existingCategorySlug =
          data.schemeCategorySlug || makeSlug(existingCategoryName);

        const categoryAlreadyExists = categoryList.some(
          (item) => item.slug === existingCategorySlug
        );

        const finalCategories = categoryAlreadyExists
          ? categoryList
          : [
              ...categoryList,
              {
                id: "current-category",
                categoryName: existingCategoryName,
                slug: existingCategorySlug,
              },
            ];

        setCategories(finalCategories);
        setSchemeCategorySlug(existingCategorySlug);
        setSchemeName(data.schemeName || data.title || "");
        setDepartment(data.department || "");
        setEligibility(data.eligibility || "");
        setBenefit(data.benefit || data.amountBenefit || "");
        setStartDate(data.startDate || data.applicationStartDate || "");
        setLastDate(data.lastDate || "");
        setDescription(data.description || data.content || "");
        setOfficialSite(data.officialSite || "");
        setOfficialPdf(data.officialPdf || data.guidelinePdfLink || "");
        setApplyLink(data.applyLink || data.applicationLink || "");
        setNotificationLink(data.notificationLink || "");
        setYoutubeUrl(data.youtubeUrl || "");
        setSchemeStatus(data.status === "closed" ? "closed" : "active");
      } catch (error) {
        console.error(error);
        alert("Failed to load scheme");
      } finally {
        setLoading(false);
      }
    };

    loadScheme();
  }, [routeId]);

  const selectedCategory = categories.find(
    (item) => item.slug === schemeCategorySlug
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!routeId) {
      alert("Scheme ID not found");
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
      alert("Please enter department name");
      return;
    }

    if (!description.trim()) {
      alert("Please enter scheme description");
      return;
    }

    try {
      setSaving(true);

      const slug = makeSlug(schemeName);

      const importantDates = [
        { label: "Application Start Date", value: startDate },
        { label: "Last Date", value: lastDate },
      ].filter((item) => item.value);

      const importantLinks = [
        { label: "Official Site", url: officialSite.trim() },
        { label: "Official PDF", url: officialPdf.trim() },
        { label: "Apply Online", url: applyLink.trim() },
        { label: "Notification / Guideline", url: notificationLink.trim() },
      ].filter((item) => item.url);

      await updateDoc(doc(db, "posts", routeId), {
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
        lastDate,
        description: description.trim(),
        content: description.trim(),
        officialSite: officialSite.trim(),
        officialPdf: officialPdf.trim(),
        applyLink: applyLink.trim(),
        notificationLink: notificationLink.trim(),
        youtubeUrl: youtubeUrl.trim(),
        status: schemeStatus,
        published: true,
        importantDates,
        importantLinks,
        links: importantLinks,
        updatedAt: serverTimestamp(),
      });

      alert("Scheme updated successfully");

      router.push("/admin/schemes");
    } catch (error) {
      console.error(error);
      alert("Failed to update scheme");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading scheme...</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
      <div>
        <label>Scheme Category</label>
        <select
          value={schemeCategorySlug}
          onChange={(e) => setSchemeCategorySlug(e.target.value)}
          style={fieldStyle()}
        >
          <option value="">Select category</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.categoryName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Scheme Name</label>
        <input
          type="text"
          placeholder="Example: State Scholarship 2026"
          value={schemeName}
          onChange={(e) => setSchemeName(e.target.value)}
          style={fieldStyle()}
        />
      </div>

      <div>
        <label>Department / Portal</label>
        <input
          type="text"
          placeholder="Example: State Scholarship Portal Odisha"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          style={fieldStyle()}
        />
      </div>

      <div>
        <label>Eligibility</label>
        <textarea
          placeholder="Enter eligibility details"
          value={eligibility}
          onChange={(e) => setEligibility(e.target.value)}
          rows={4}
          style={{
            ...fieldStyle(),
            resize: "vertical",
          }}
        />
      </div>

      <div>
        <label>Benefit / Amount</label>
        <input
          type="text"
          placeholder="Example: ₹5,000 / Tuition fee support"
          value={benefit}
          onChange={(e) => setBenefit(e.target.value)}
          style={fieldStyle()}
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
            style={fieldStyle()}
          />
        </div>

        <div>
          <label>Last Date</label>
          <input
            type="date"
            value={lastDate}
            onChange={(e) => setLastDate(e.target.value)}
            style={fieldStyle()}
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
          style={{
            ...fieldStyle(),
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
          style={fieldStyle()}
        />
      </div>

      <div>
        <label>Official PDF / Guideline Link</label>
        <input
          type="url"
          placeholder="https://example.gov.in/scheme.pdf"
          value={officialPdf}
          onChange={(e) => setOfficialPdf(e.target.value)}
          style={fieldStyle()}
        />
      </div>

      <div>
        <label>Apply Online Link</label>
        <input
          type="url"
          placeholder="https://example.gov.in/apply"
          value={applyLink}
          onChange={(e) => setApplyLink(e.target.value)}
          style={fieldStyle()}
        />
      </div>

      <div>
        <label>Notification / Guideline Link</label>
        <input
          type="url"
          placeholder="https://example.gov.in/notification"
          value={notificationLink}
          onChange={(e) => setNotificationLink(e.target.value)}
          style={fieldStyle()}
        />
      </div>

      <div>
        <label>YouTube Video Link</label>
        <input
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          style={fieldStyle()}
        />
      </div>

      <div>
        <label>Status</label>
        <select
          value={schemeStatus}
          onChange={(e) => setSchemeStatus(e.target.value)}
          style={fieldStyle()}
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
        {saving ? "Updating..." : "Update Scheme"}
      </button>
    </form>
  );
}

export default EditSchemeForm;