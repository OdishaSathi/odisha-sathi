"use client";

import { useEffect, useState } from "react";
import { AdmitCard, AdmitCardLink, AdmitCardStatus } from "@/types/admitCard";
import { createAdmitCardSlug } from "@/lib/admitCards";
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

type AdmitCardFormProps = {
  initialData?: AdmitCard | null;
  onSubmit: (data: AdmitCard) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
};


const ADMIT_CARD_BASE_CATEGORY_OPTIONS = [
  { label: "Odisha Admit Cards & Exams", value: "odisha-admit-cards" },
  { label: "Central Admit Cards & Exams", value: "central-admit-cards" },
  { label: "Board Admit Cards & Exams", value: "board-admit-cards" },
  { label: "University Admit Cards & Exams", value: "university-admit-cards" },
  { label: "Entrance Admit Cards & Exams", value: "entrance-admit-cards" },
  { label: "Recruitment Admit Cards & Exams", value: "recruitment-admit-cards" },
  { label: "10th Admit Cards & Exams", value: "10th-admit-cards" },
  { label: "+2 Admit Cards & Exams", value: "plus-two-admit-cards" },
  { label: "+3 Admit Cards & Exams", value: "plus-three-admit-cards" },
  { label: "Other Admit Cards & Exams", value: "other-admit-cards" },
];

const emptyLinks: AdmitCardLink[] = [
  {
    label: "Download Admit Card",
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

const emptyForm: AdmitCard = {
  title: "",
  slug: "",
  examName: "",
  organization: "",
  updateType: "admit-card",
  updateTypeLabel: "Admit Card",
  subCategory: "odisha-admit-cards",
  subCategories: ["Odisha Admit Cards & Exams", "odisha-admit-cards"],
  admitCardCategory: "Odisha Admit Cards & Exams",
  admitCardCategories: ["Odisha Admit Cards & Exams"],
  categoryName: "Odisha Admit Cards & Exams",
  categorySlug: "odisha-admit-cards",
  subCategorySlug: "odisha-admit-cards",
  admitCardDate: "",
  admitCardDateDisplay: "",
  examDate: "",
  examDateDisplay: "",
  importantDates: [],
  description: "",
  notificationNumber: "",
  previewImageUrl: "",
  examMode: "",
  downloadProcess: "",
  documentsRequired: [],
  contentSections: [],
  dataTables: [],
  youtubeUrl: "",
  youtubeUrls: [],
  status: "Released",
  links: emptyLinks,
};

export default function AdmitCardForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save Admit Card",
}: AdmitCardFormProps) {
  const [formData, setFormData] = useState<AdmitCard>(emptyForm);
  const [admitCategoryOptions, setAdmitCategoryOptions] = useState(ADMIT_CARD_BASE_CATEGORY_OPTIONS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadManagedAdmitCategories() {
      try {
        const managed = await getActiveAdminSubCategories("admit-cards");
        if (isMounted) {
          setAdmitCategoryOptions(
            mergeSubCategoryOptions(ADMIT_CARD_BASE_CATEGORY_OPTIONS, managed)
          );
        }
      } catch (error) {
        console.warn("Could not load managed admit card subcategories.", error);
      }
    }

    loadManagedAdmitCategories();

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
            : [initialData.subCategory || "odisha-admit-cards"],
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

  const updateField = (field: keyof AdmitCard, value: string) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      if (field === "title" && !initialData) {
        updated.slug = createAdmitCardSlug(value);
      }

      return updated;
    });
  };

  const selectedAdmitCategoryValues = admitCategoryOptions
    .filter((option) =>
      (formData.subCategories || []).some(
        (item) => item === option.value || item === option.label
      )
    )
    .map((option) => option.value);

  const toggleAdmitCategory = (value: string) => {
    const nextValues = selectedAdmitCategoryValues.includes(value)
      ? selectedAdmitCategoryValues.filter((item) => item !== value)
      : [...selectedAdmitCategoryValues, value];
    const selected = admitCategoryOptions.filter((item) =>
      nextValues.includes(item.value)
    );
    const primary = selected[0] || ADMIT_CARD_BASE_CATEGORY_OPTIONS[0];

    setFormData((prev) => ({
      ...prev,
      subCategory: primary.value,
      subCategories: selected.flatMap((item) => [item.label, item.value]),
      admitCardCategory: primary.label,
      admitCardCategories: selected.map((item) => item.label),
      examCategory: primary.label,
      examCategories: selected.map((item) => item.label),
      categoryName: primary.label,
      categorySlug: primary.value,
      subCategorySlug: primary.value,
    }));
  };

  const updateAdmitUpdateType = (value: "admit-card" | "exam") => {
    setFormData((prev) => ({
      ...prev,
      updateType: value,
      updateTypeLabel: value === "exam" ? "Exam" : "Admit Card",
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
      } as AdmitCard;
    });
  };

  const updateLink = (
    index: number,
    field: keyof AdmitCardLink,
    value: string
  ) => {
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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

      const selectedCategories = admitCategoryOptions.filter((item) =>
        selectedAdmitCategoryValues.includes(item.value)
      );
      if (selectedCategories.length === 0) {
        alert("Please select at least one Admit Card & Exam subcategory.");
        return;
      }
      const selectedCategory = selectedCategories[0];
      const selectedUpdateType = formData.updateType === "exam" ? "exam" : "admit-card";
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
        examMode: (formData.examMode || "").trim(),
        contentSections: cleanFlexibleDetailSections(
          formData.contentSections || []
        ),
        detailSections: cleanFlexibleDetailSections(
          formData.contentSections || []
        ),
        dataTables: cleanFlexibleDataTables(formData.dataTables || []),
        customTables: cleanFlexibleDataTables(formData.dataTables || []),
        downloadProcess: (formData.downloadProcess || "").trim(),
        applicationProcess: (formData.downloadProcess || "").trim(),
        documentsRequired: cleanJobDocuments(
          formData.documentsRequired || []
        ),
        updateType: selectedUpdateType,
        updateTypeLabel: selectedUpdateType === "exam" ? "Exam" : "Admit Card",
        subCategory: selectedCategory.value,
        subCategories: selectedCategories.flatMap((item) => [
          item.label,
          item.value,
        ]),
        admitCardCategory: selectedCategory.label,
        admitCardCategories: selectedCategories.map((item) => item.label),
        examCategory: selectedCategory.label,
        examCategories: selectedCategories.map((item) => item.label),
        categoryName: selectedCategory.label,
        categorySlug: selectedCategory.value,
        subCategorySlug: selectedCategory.value,
        slug: createAdmitCardSlug(formData.slug || formData.title),
        admitCardDate: (formData.admitCardDate || "").trim(),
        admitCardDateDisplay: (formData.admitCardDateDisplay || "").trim(),
        examDate: (formData.examDate || "").trim(),
        examDateDisplay: (formData.examDateDisplay || "").trim(),
        importantDates: [
          {
            label: "Admit Card Date",
            value: (
              formData.admitCardDateDisplay ||
              formData.admitCardDate ||
              ""
            ).trim(),
          },
          {
            label: "Exam Date",
            value: (formData.examDateDisplay || formData.examDate || "").trim(),
          },
        ].filter((item) => item.value),
        links: cleanedLinks,
        importantLinks: cleanedLinks,
        youtubeUrl: (formData.youtubeUrl || "").trim(),
        youtubeUrls: cleanedYoutubeUrls,
      });

      if (!initialData) {
        setFormData(emptyForm);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to save admit card.");
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
            placeholder="Example: OTET Admit Card 2026 Released"
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
            placeholder="otet-admit-card-2026"
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
          <label>Exam Mode</label>
          <input
            type="text"
            value={formData.examMode || ""}
            onChange={(event) => updateField("examMode", event.target.value)}
            placeholder="Online / Offline / Computer Based Test"
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

        <div className="admin-form-group">
          <label>Update Type</label>
          <select
            value={formData.updateType || "admit-card"}
            onChange={(event) =>
              updateAdmitUpdateType(event.target.value as "admit-card" | "exam")
            }
          >
            <option value="admit-card">Admit Card</option>
            <option value="exam">Exam</option>
          </select>
        </div>

        <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
          <label>Subcategories (select one or more)</label>
          <div className="admin-checkbox-grid">
            {admitCategoryOptions.map((item) => (
              <label className="admin-checkbox-card" key={item.value}>
                <input
                  type="checkbox"
                  checked={selectedAdmitCategoryValues.includes(item.value)}
                  onChange={() => toggleAdmitCategory(item.value)}
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>

        <div className="admin-form-group">
          <label>Admit Card Released Date</label>
          <input
            type="date"
            value={formData.admitCardDate}
            onChange={(event) =>
              updateField("admitCardDate", event.target.value)
            }
          />
          <input
            type="text"
            value={formData.admitCardDateDisplay || ""}
            onChange={(event) =>
              updateField("admitCardDateDisplay", event.target.value)
            }
            placeholder="Optional display text: July 2026 / Coming Soon"
          />
        </div>

        <div className="admin-form-group">
          <label>Exam Date</label>
          <input
            type="date"
            value={formData.examDate}
            onChange={(event) => updateField("examDate", event.target.value)}
          />
          <input
            type="text"
            value={formData.examDateDisplay || ""}
            onChange={(event) => updateField("examDateDisplay", event.target.value)}
            placeholder="Optional display text: Expected in July 2026"
          />
        </div>

        <div className="admin-form-group">
          <label>Status</label>
          <select
            value={formData.status}
            onChange={(event) =>
              updateField("status", event.target.value as AdmitCardStatus)
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
          placeholder="Write admit card details, exam instructions, download process, required documents, etc."
          rows={8}
        />
      </div>

      <div className="admin-form-group">
        <label>Admit Card Download / Exam Process</label>
        <textarea
          value={formData.downloadProcess || ""}
          onChange={(event) =>
            updateField("downloadProcess", event.target.value)
          }
          placeholder="Write the download or checking process step by step."
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
        sectionLabel="Optional Exam / Admit Card Details and Data Tables"
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
