"use client";

import { useEffect, useState } from "react";
import { AdmitCard, AdmitCardLink, AdmitCardStatus } from "@/types/admitCard";
import { createAdmitCardSlug } from "@/lib/admitCards";

type AdmitCardFormProps = {
  initialData?: AdmitCard | null;
  onSubmit: (data: AdmitCard) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
};

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
  admitCardDate: "",
  examDate: "",
  description: "",
  youtubeUrl: "",
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
      await onSubmit({
        ...formData,
        slug: createAdmitCardSlug(formData.slug || formData.title),
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
          <label>Admit Card Released Date</label>
          <input
            type="date"
            value={formData.admitCardDate}
            onChange={(event) =>
              updateField("admitCardDate", event.target.value)
            }
          />
        </div>

        <div className="admin-form-group">
          <label>Exam Date</label>
          <input
            type="date"
            value={formData.examDate}
            onChange={(event) => updateField("examDate", event.target.value)}
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
          placeholder="Write admit card details, exam instructions, download process, required documents, etc."
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