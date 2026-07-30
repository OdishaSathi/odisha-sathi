"use client";

import { useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

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

  async function uploadImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be 5 MB or less.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      const safeName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const imageRef = ref(
        storage,
        `${folder}/${Date.now()}-${safeName || "image"}`
      );
      await uploadBytes(imageRef, file, { contentType: file.type });
      onChange(await getDownloadURL(imageRef));
    } catch (uploadError) {
      console.error(uploadError);
      setError(
        "Upload failed. Check Firebase Storage permission or paste an image URL."
      );
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
            onChange(event.target.value);
          }}
          placeholder="Paste image URL"
        />
        <label className="image-upload-button">
          {uploading ? "Uploading…" : "Upload image"}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(event) => uploadImage(event.target.files?.[0])}
          />
        </label>
      </div>
      {helpText ? <small>{helpText}</small> : null}
      {error ? <p>{error}</p> : null}
      {value.trim() ? (
        <div className="image-upload-preview">
          <img src={value.trim()} alt={`${label} preview`} />
          <button type="button" onClick={() => onChange("")}>
            Remove
          </button>
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
