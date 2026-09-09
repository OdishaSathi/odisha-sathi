"use client";

import { FormEvent, useEffect, useState } from "react";
import { ResultLink, ResultPost, ResultStatus } from "@/types/result";
import { createResultSlug } from "@/lib/results";
import { normalizeCompatiblePostLinks } from "@/lib/postLinkCompatibility";
import {
  getActiveAdminSubCategories,
  mergeSubCategoryOptions,
} from "@/lib/adminSubCategories";
import FlexibleDetailsEditor from "@/components/admin/FlexibleDetailsEditor";
import CommonDocumentsEditor from "@/components/admin/CommonDocumentsEditor";
import {
  cleanJobDocuments,
  normalizeJobDocuments,
} from "@/lib/jobDetails";
import {
  cleanFlexibleDataTables,
  cleanFlexibleDetailSections,
  normalizeFlexibleDataTables,
  normalizeFlexibleDetailSections,
} from "@/lib/flexibleDetails";

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
  notificationNumber: "",
  previewImageUrl: "",
  resultCheckingProcess: "",
  documentsRequired: [],
  contentSections: [],
  dataTables: [],
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
        subCategories:
          initialData.subCategories?.length
            ? initialData.subCategories
            : [initialData.subCategory || "odisha-results"],
        contentSections: normalizeFlexibleDetailSections(
          initialData.contentSections || initialData.detailSections
        ),
        dataTables: normalizeFlexibleDataTables(
          initialData.dataTables || initialData.customTables
        ),
        documentsRequired: normalizeJobDocuments(initialData),
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

  const selectedResultCategoryValues = resultCategoryOptions
    .filter((option) =>
      (formData.subCategories || []).some(
        (item) => item === option.value || item === option.label
      )
    )
    .map((option) => option.value);

  const toggleResultCategory = (value: string) => {
    const nextValues = selectedResultCategoryValues.includes(value)
      ? selectedResultCategoryValues.filter((item) => item !== value)
      : [...selectedResultCategoryValues, value];
    const selected = resultCategoryOptions.filter((item) =>
      nextValues.includes(item.value)
    );
    const primary = selected[0] || RESULT_BASE_CATEGORY_OPTIONS[0];

    setFormData((prev) => ({
      ...prev,
      subCategory: primary.value,
      subCategories: selected.flatMap((item) => [item.label, item.value]),
      resultCategory: primary.label,
      resultCategories: selected.map((item) => item.label),
      categoryName: primary.label,
      categorySlug: primary.value,
      subCategorySlug: primary.value,
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

      const selectedCategories = resultCategoryOptions.filter((item) =>
        selectedResultCategoryValues.includes(item.value)
      );
      if (selectedCategories.length === 0) {
        alert("Please select at least one result subcategory.");
        return;
      }
      const selectedCategory = selectedCategories[0];
      const cleanedLinks = formData.links
        .map((link) => ({
          label: link.label.trim(),
          url: link.url.trim(),
        }))
        .filter((link) => link.label && link.url);

      await onSubmit({
        ...formData,
        notificationNumber: (formData.notificationNumber || "").trim(),
        previewImageUrl: (formData.previewImageUrl || "").trim(),
        imageUrl: (formData.previewImageUrl || "").trim(),
        contentSections: cleanFlexibleDetailSections(
          formData.contentSections || []
        ),
        detailSections: cleanFlexibleDetailSections(
          formData.contentSections || []
        ),
        dataTables: cleanFlexibleDataTables(formData.dataTables || []),
        customTables: cleanFlexibleDataTables(formData.dataTables || []),
        resultCheckingProcess: (formData.resultCheckingProcess || "").trim(),
        applicationProcess: (formData.resultCheckingProcess || "").trim(),
        documentsRequired: cleanJobDocuments(
          formData.documentsRequired || []
        ),
        subCategory: selectedCategory.value,
        subCategories: selectedCategories.flatMap((item) => [
          item.label,
          item.value,
        ]),
        resultCategory: selectedCategory.label,
        resultCategories: selectedCategories.map((item) => item.label),
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
            readOnly={Boolean(initialData)}
            title={initialData ? "The public URL is locked after publishing." : ""}
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
          <label>Notification / Reference Number</label>
          <input
            type="text"
            value={formData.notificationNumber || ""}
            onChange={(event) =>
              updateField("notificationNumber", event.target.value)
            }
            placeholder="Optional"
          />
        </div>

        <div className="admin-form-group">
          <label>Preview Image URL</label>
          <input
            type="url"
            value={formData.previewImageUrl || ""}
            onChange={(event) =>
              updateField("previewImageUrl", event.target.value)
            }
            placeholder="Optional image URL"
          />
        </div>

        <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
          <label>Result Subcategories (select one or more)</label>
          <div className="admin-checkbox-grid">
            {resultCategoryOptions.map((item) => (
              <label className="admin-checkbox-card" key={item.value}>
                <input
                  type="checkbox"
                  checked={selectedResultCategoryValues.includes(item.value)}
                  onChange={() => toggleResultCategory(item.value)}
                />
                {item.label}
              </label>
            ))}
          </div>
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

      <div className="admin-form-group">
        <label>How to Check Result / Result Process</label>
        <textarea
          value={formData.resultCheckingProcess || ""}
          onChange={(event) =>
            updateField("resultCheckingProcess", event.target.value)
          }
          placeholder="Write the result checking process step by step."
          rows={6}
        />
      </div>

      <CommonDocumentsEditor
        documents={formData.documentsRequired || []}
        onChange={(documentsRequired) =>
          setFormData((previous) => ({ ...previous, documentsRequired }))
        }
      />

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

      <FlexibleDetailsEditor
        detailSections={formData.contentSections || []}
        dataTables={formData.dataTables || []}
        onDetailSectionsChange={(contentSections) =>
          setFormData((previous) => ({ ...previous, contentSections }))
        }
        onDataTablesChange={(dataTables) =>
          setFormData((previous) => ({ ...previous, dataTables }))
        }
        sectionLabel="Optional Result Details and Data Tables"
      />

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
