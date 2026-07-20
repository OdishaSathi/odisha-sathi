"use client";

import { FormEvent, useEffect, useState } from "react";
import { ResultLink, ResultPost, ResultStatus } from "@/types/result";
import { createResultSlug } from "@/lib/results";
import { normalizeCompatiblePostLinks } from "@/lib/postLinkCompatibility";
import {
  getActiveAdminSubCategories,
  mergeSubCategoryOptions,
} from "@/lib/adminSubCategories";

type ResultFormProps = {
  initialData?: ResultPost | null;
  onSubmit: (data: ResultPost) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
};


const RESULT_BASE_CATEGORY_OPTIONS = [
  { label: "Odisha Results", value: "odisha-results" },
  { label: "Central Results", value: "central-results" },
  { label: "Board Results", value: "board-results" },
  { label: "University Results", value: "university-results" },
  { label: "Entrance Results", value: "entrance-results" },
  { label: "Recruitment Results", value: "recruitment-results" },
  { label: "10th Results", value: "10th-results" },
  { label: "+2 Results", value: "plus-two-results" },
  { label: "+3 Results", value: "plus-three-results" },
  { label: "Other Results", value: "other-results" },
];

const emptyLinks: ResultLink[] = [
  {
    label: "Check Result",
    url: "",
  },
  {
    label: "Notification / Notice",
    url: "",
  },
  {
    label: "Official Website",
    url: "",
  },
];

const emptyForm: ResultPost = {
  title: "",
  slug: "",
  examName: "",
  organization: "",
  subCategory: "odisha-results",
  subCategories: ["Odisha Results", "odisha-results"],
  resultCategory: "Odisha Results",
  resultCategories: ["Odisha Results"],
  categoryName: "Odisha Results",
  categorySlug: "odisha-results",
  subCategorySlug: "odisha-results",
  resultDate: "",
  resultDateDisplay: "",
  importantDates: [],
  description: "",
  youtubeUrl: "",
  youtubeUrls: [],
  status: "Released",
  links: emptyLinks,
};

export default function ResultForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save Result",
}: ResultFormProps) {
  const [formData, setFormData] = useState<ResultPost>(emptyForm);
  const [resultCategoryOptions, setResultCategoryOptions] = useState(RESULT_BASE_CATEGORY_OPTIONS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadManagedResultCategories() {
      try {
        const managed = await getActiveAdminSubCategories("results");
        if (isMounted) {
          setResultCategoryOptions(
            mergeSubCategoryOptions(RESULT_BASE_CATEGORY_OPTIONS, managed)
          );
        }
      } catch (error) {
        console.warn("Could not load managed result subcategories.", error);
      }
    }

    loadManagedResultCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (initialData) {
      const savedLinks = normalizeCompatiblePostLinks(
        initialData as unknown as Record<string, unknown>
      ).map((row) => ({
        label: row.label || row.type || "Official Link",
        url: row.url || "",
      }));

      setFormData({
        ...emptyForm,
        ...initialData,
        links: savedLinks.length > 0 ? savedLinks : emptyLinks,
      });
    } else {
      setFormData(emptyForm);
    }
  }, [initialData]);

  const updateField = (field: keyof ResultPost, value: string) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      if (field === "title" && !initialData) {
        updated.slug = createResultSlug(value);
      }

      return updated;
    });
  };

  const updateResultCategory = (value: string) => {
    const selected = resultCategoryOptions.find((item) => item.value === value);

    setFormData((prev) => ({
      ...prev,
      subCategory: value,
      subCategories: selected ? [selected.label, selected.value] : [value],
      resultCategory: selected?.label || value,
      resultCategories: selected ? [selected.label] : [value],
      categoryName: selected?.label || value,
      categorySlug: value,
      subCategorySlug: value,
    }));
  };

  const updateYoutubeUrl = (index: number, value: string) => {
    setFormData((prev) => {
      const currentUrls = Array.isArray((prev as any).youtubeUrls)
        ? [...((prev as any).youtubeUrls as string[])]
        : [];

      currentUrls[index] = value;

      return {
        ...prev,
        youtubeUrls: currentUrls,
      } as ResultPost;
    });
  };

  const updateLink = (index: number, field: keyof ResultLink, value: string) => {
    setFormData((prev) => {
      const updatedLinks = [...prev.links];

      updatedLinks[index] = {
        ...updatedLinks[index],
        [field]: value,
      };

      return {
        ...prev,
        links: updatedLinks,
      };
    });
  };

  const addLinkRow = () => {
    setFormData((prev) => ({
      ...prev,
      links: [
        ...prev.links,
        {
          label: "",
          url: "",
        },
      ],
    }));
  };

  const removeLinkRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      links: prev.links.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.title.trim()) {
      alert("Please enter title.");
      return;
    }

    if (!formData.slug.trim()) {
      alert("Please enter slug.");
      return;
    }

    if (!formData.examName.trim()) {
      alert("Please enter exam name.");
      return;
    }

    setIsSaving(true);

    try {
      const cleanedYoutubeUrls = Array.isArray((formData as any).youtubeUrls)
        ? ((formData as any).youtubeUrls as string[])
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 2)
        : [];

      const selectedCategory =
        resultCategoryOptions.find(
          (item) => item.value === (formData.subCategory || "")
        ) || RESULT_BASE_CATEGORY_OPTIONS[0];
      const cleanedLinks = formData.links
        .map((link) => ({
          label: link.label.trim(),
          url: link.url.trim(),
        }))
        .filter((link) => link.label && link.url);

      await onSubmit({
        ...formData,
        subCategory: selectedCategory.value,
        subCategories: [selectedCategory.label, selectedCategory.value],
        resultCategory: selectedCategory.label,
        resultCategories: [selectedCategory.label],
        categoryName: selectedCategory.label,
        categorySlug: selectedCategory.value,
        subCategorySlug: selectedCategory.value,
        slug: createResultSlug(formData.slug || formData.title),
        resultDate: (formData.resultDate || "").trim(),
        resultDateDisplay: (formData.resultDateDisplay || "").trim(),
        importantDates: [
          {
            label: "Result Date",
            value: (formData.resultDateDisplay || formData.resultDate || "").trim(),
          },
        ].filter((item) => item.value),
        youtubeUrl: (formData.youtubeUrl || "").trim(),
        youtubeUrls: cleanedYoutubeUrls,
        links: cleanedLinks,
        importantLinks: cleanedLinks,
      });

      if (!initialData) {
        setFormData(emptyForm);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save result.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-form-grid">
        <div className="admin-form-group">
          <label>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Example: OTET Result 2026 Released"
            required
          />
        </div>

        <div className="admin-form-group">
          <label>Slug</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(event) => updateField("slug", event.target.value)}
            placeholder="otet-result-2026"
            required
          />
        </div>

        <div className="admin-form-group">
          <label>Exam Name</label>
          <input
            type="text"
            value={formData.examName}
            onChange={(event) => updateField("examName", event.target.value)}
            placeholder="OTET 2026"
            required
          />
        </div>

        <div className="admin-form-group">
          <label>Organization</label>
          <input
            type="text"
            value={formData.organization}
            onChange={(event) =>
              updateField("organization", event.target.value)
            }
            placeholder="Board of Secondary Education, Odisha"
          />
        </div>

        <div className="admin-form-group">
          <label>Result Subcategory</label>
          <select
            value={formData.subCategory || "odisha-results"}
            onChange={(event) => updateResultCategory(event.target.value)}
          >
            {resultCategoryOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-form-group">
          <label>Result Date</label>
          <input
            type="date"
            value={formData.resultDate}
            onChange={(event) => updateField("resultDate", event.target.value)}
          />
          <input
            type="text"
            value={formData.resultDateDisplay || ""}
            onChange={(event) =>
              updateField("resultDateDisplay", event.target.value)
            }
            placeholder="Optional display text: July 2026 / Coming Soon"
          />
        </div>

        <div className="admin-form-group">
          <label>Status</label>
          <select
            value={formData.status}
            onChange={(event) =>
              updateField("status", event.target.value as ResultStatus)
            }
          >
            <option value="Released">Released</option>
            <option value="Coming Soon">Coming Soon</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="admin-form-group">
          <label>YouTube Video 1</label>
          <input
            type="url"
            value={formData.youtubeUrl || ""}
            onChange={(event) => updateField("youtubeUrl", event.target.value)}
            placeholder="https://youtube.com/..."
          />
        </div>

        <div className="admin-form-group">
          <label>YouTube Video 2</label>
          <input
            type="url"
            value={((formData as any).youtubeUrls || [])[0] || ""}
            onChange={(event) => updateYoutubeUrl(0, event.target.value)}
            placeholder="https://youtube.com/..."
          />
        </div>

        <div className="admin-form-group">
          <label>YouTube Video 3</label>
          <input
            type="url"
            value={((formData as any).youtubeUrls || [])[1] || ""}
            onChange={(event) => updateYoutubeUrl(1, event.target.value)}
            placeholder="https://youtube.com/..."
          />
        </div>
      </div>

      <div className="admin-form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(event) => updateField("description", event.target.value)}
          placeholder="Write result details, how to check result, required details, official instructions, etc."
          rows={8}
        />
      </div>

      <div className="admin-section-box">
        <div className="admin-section-title-row">
          <h3>Important Links</h3>

          <button type="button" className="admin-small-btn" onClick={addLinkRow}>
            + Add Link
          </button>
        </div>

        {formData.links.map((link, index) => (
          <div className="admin-link-row" key={index}>
            <input
              type="text"
              value={link.label}
              onChange={(event) =>
                updateLink(index, "label", event.target.value)
              }
              placeholder="Link Label"
            />

            <input
              type="url"
              value={link.url}
              onChange={(event) => updateLink(index, "url", event.target.value)}
              placeholder="https://example.com"
            />

            <button
              type="button"
              className="admin-danger-btn"
              onClick={() => removeLinkRow(index)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="admin-form-actions">
        <button type="submit" className="admin-submit-btn" disabled={isSaving}>
          {isSaving ? "Saving..." : submitLabel}
        </button>

        {onCancel && (
          <button type="button" className="admin-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
