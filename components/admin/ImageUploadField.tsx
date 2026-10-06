"use client";

import { useState } from "react";
import {
  isSupportedPublicImageUrl,
  normalizePublicImageUrl,
} from "@/lib/publicImageUrl";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helpText?: string;
};

export default function ImageUploadField({
  label,
  value,
  onChange,
  helpText,
}: Props) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const normalizedValue = normalizePublicImageUrl(value);
  const unsupportedUrl = Boolean(value.trim()) && !isSupportedPublicImageUrl(value);

  return (
    <div className="image-url-field">
      <label>{label}</label>
      <input
        type="text"
        inputMode="url"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={(event) => {
          setPreviewFailed(false);
          onChange(event.target.value);
        }}
        onBlur={(event) => {
          const normalized = normalizePublicImageUrl(event.currentTarget.value);
          if (normalized && normalized !== event.currentTarget.value) {
            onChange(normalized);
          }
        }}
        placeholder="Paste a public direct image URL (JPG, PNG, WebP or GIF)"
      />
      {helpText ? <small>{helpText}</small> : null}
      <small>
        Use a public direct image link. Leave it blank to use the available
        YouTube thumbnail or the default Odisha Sathi banner.
      </small>

      {normalizedValue && !unsupportedUrl ? (
        <div className="image-url-preview">
          <img
            key={normalizedValue}
            src={normalizedValue}
            alt={label + " preview"}
            onLoad={() => setPreviewFailed(false)}
            onError={() => setPreviewFailed(true)}
          />
          <button
            type="button"
            onClick={() => {
              setPreviewFailed(false);
              onChange("");
            }}
          >
            Remove
          </button>
          {previewFailed ? (
            <p>
              The preview could not be loaded here. You can still save this
              public image URL, paste another link, or leave it blank for the
              automatic fallback banner.
            </p>
          ) : null}
        </div>
      ) : null}

      {unsupportedUrl ? (
        <p className="image-url-error">
          This does not look like a complete public image URL. Use an address
          beginning with https://, or remove it to use the fallback banner.
        </p>
      ) : null}

      <style jsx>{`
        .image-url-field {
          display: grid;
          gap: 7px;
        }
        label {
          color: #374151;
          font-size: 14px;
          font-weight: 700;
        }
        input {
          box-sizing: border-box;
          width: 100%;
          min-height: 42px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px 12px;
          background: #ffffff;
          color: #0f172a;
        }
        small {
          color: #64748b;
          line-height: 1.45;
        }
        .image-url-preview {
          display: grid;
          grid-template-columns: minmax(0, 420px) auto;
          align-items: center;
          gap: 12px;
        }
        .image-url-preview img {
          width: 100%;
          max-height: 260px;
          object-fit: contain;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #f8fafc;
        }
        button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: fit-content;
          min-height: 42px;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 9px 12px;
          background: #fff1f2;
          color: #be123c;
          font-weight: 800;
          cursor: pointer;
        }
        .image-url-preview p,
        .image-url-error {
          grid-column: 1 / -1;
          margin: 0;
          color: #b91c1c;
          font-size: 13px;
          font-weight: 800;
        }
        @media (max-width: 620px) {
          .image-url-preview {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
