"use client";

import { FormEvent, useEffect, useState } from "react";
import { ResultLink, ResultPost, ResultStatus } from "@/types/result";
import { createResultSlug } from "@/lib/results";

type ResultFormProps = {
  initialData?: ResultPost | null;
  onSubmit: (data: ResultPost) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
};

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
  resultDate: "",
  description: "",
  youtubeUrl: "",
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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...emptyForm,
        ...initialData,
        links:
          initialData.links && initialData.links.length > 0
            ? initialData.links
            : emptyLinks,
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
      await onSubmit({
        ...formData,
        slug: createResultSlug(formData.slug || formData.title),
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
          <label>Result Date</label>
          <input
            type="date"
            value={formData.resultDate}
            onChange={(event) => updateField("resultDate", event.target.value)}
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
          <label>YouTube Link</label>
          <input
            type="url"
            value={formData.youtubeUrl || ""}
            onChange={(event) => updateField("youtubeUrl", event.target.value)}
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