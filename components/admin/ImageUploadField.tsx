"use client";

import { useState } from "react";
import {
  getImageUploadErrorMessage,
  uploadImageFile,
} from "@/lib/clientImageUpload";
import { normalizePublicImageUrl } from "@/lib/publicImageUrl";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText?: string;
  folder?: string;
};

export default function ImageUploadField({
  label,
  value,
  onChange,
  helpText,
  folder = "post-images",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);

  async function uploadImage(file?: File) {
    try {
      setUploading(true);
      setError("");
      onChange(await uploadImageFile(file, { folder }));
    } catch (uploadError) {
      console.error(uploadError);
      setError(getImageUploadErrorMessage(uploadError));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="image-upload-field">
      <label>{label}</label>
      <div className="image-upload-grid">
        <input
          type="url"
          value={value}
          onChange={(event) => {
            setError("");
            setPreviewFailed(false);
            onChange(event.target.value);
          }}
          onBlur={(event) => {
            const normalized = normalizePublicImageUrl(event.currentTarget.value);
            if (normalized && normalized !== event.currentTarget.value) onChange(normalized);
          }}
          placeholder="Paste direct image URL (JPG, PNG, WebP, GIF)"
        />
        <label className="image-upload-button">
          {uploading ? "Uploading…" : "Upload image"}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(event) => {
              uploadImage(event.target.files?.[0]);
              event.currentTarget.value = "";
            }}
          />
        </label>
      </div>
      {helpText ? <small>{helpText}</small> : null}
      <small>Best support: JPG/JPEG, PNG, WebP or GIF. Google Drive and Dropbox share links are normalized automatically when possible.</small>
      {error ? <p>{error}</p> : null}
      {value.trim() ? (
        <div className="image-upload-preview">
          <img
            src={normalizePublicImageUrl(value.trim())}
            alt={`${label} preview`}
            onLoad={() => setPreviewFailed(false)}
            onError={() => setPreviewFailed(true)}
          />
          <button type="button" onClick={() => { setPreviewFailed(false); onChange(""); }}>
            Remove
          </button>
          {previewFailed ? (
            <p className="image-preview-warning">This URL cannot be previewed directly. Prefer Upload image, or use a public direct image URL.</p>
          ) : null}
        </div>
      ) : null}

      <style jsx>{`
        .image-upload-field {
          display: grid;
          gap: 7px;
        }
        label {
          color: #374151;
          font-size: 14px;
          font-weight: 700;
        }
        .image-upload-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
        }
        input[type="url"] {
          width: 100%;
          min-height: 42px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px 12px;
        }
        input[type="file"] {
          display: none;
        }
        .image-upload-button,
        button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          border: 1px solid #2563eb;
          border-radius: 8px;
          padding: 9px 12px;
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 800;
          cursor: pointer;
        }
        small {
          color: #64748b;
        }
        p {
          margin: 0;
          color: #b91c1c;
          font-size: 13px;
          font-weight: 800;
        }
        .image-upload-preview {
          display: grid;
          grid-template-columns: minmax(0, 420px) auto;
          align-items: center;
          gap: 12px;
        }
        .image-upload-preview img {
          width: 100%;
          max-height: 260px;
          object-fit: contain;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #f8fafc;
        }
        .image-upload-preview button {
          border-color: #fecaca;
          background: #fff1f2;
          color: #be123c;
        }
        .image-preview-warning {
          grid-column: 1 / -1;
        }
        @media (max-width: 620px) {
          .image-upload-grid,
          .image-upload-preview {
            grid-template-columns: 1fr;
          }
          .image-upload-button,
          button {
            width: fit-content;
          }
        }
      `}</style>
    </div>
  );
}
