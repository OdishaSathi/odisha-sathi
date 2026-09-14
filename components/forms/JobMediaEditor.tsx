"use client";

import { useState } from "react";
import { normalizePublicImageUrl } from "@/lib/publicImageUrl";

type JobMediaEditorProps = {
  imageUrl: string;
  youtubeUrl: string;
  youtubeUrl2: string;
  youtubeUrl3: string;
  onImageUrlChange: (value: string) => void;
  onYoutubeUrlChange: (index: number, value: string) => void;
};

export default function JobMediaEditor({
  imageUrl,
  youtubeUrl,
  youtubeUrl2,
  youtubeUrl3,
  onImageUrlChange,
  onYoutubeUrlChange,
}: JobMediaEditorProps) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const videos = [youtubeUrl, youtubeUrl2, youtubeUrl3];
  const normalizedImageUrl = normalizePublicImageUrl(imageUrl);

  return (
    <details className="job-media-editor">
      <summary>Banner image and YouTube videos</summary>

      <div className="job-media-body">
        <div className="job-media-priority">
          Banner priority: direct image URL → first YouTube thumbnail → current
          default Job banner.
        </div>

        <label>
          Direct image URL
          <input
            type="url"
            value={imageUrl}
            onChange={(event) => {
              setPreviewFailed(false);
              onImageUrlChange(event.target.value);
            }}
            onBlur={(event) => {
              const normalized = normalizePublicImageUrl(
                event.currentTarget.value
              );
              if (normalized && normalized !== event.currentTarget.value) {
                onImageUrlChange(normalized);
              }
            }}
            placeholder="https://example.com/job-banner.jpg"
          />
          <small>
            Leave blank to use the first YouTube thumbnail or the default Job
            banner.
          </small>
        </label>

        {normalizedImageUrl ? (
          <div className="job-media-preview">
            <img
              key={normalizedImageUrl}
              src={normalizedImageUrl}
              alt="Selected Job banner preview"
              onLoad={() => setPreviewFailed(false)}
              onError={() => setPreviewFailed(true)}
            />
            <button
              type="button"
              onClick={() => {
                setPreviewFailed(false);
                onImageUrlChange("");
              }}
            >
              Remove image
            </button>
            {previewFailed ? (
              <p>
                This address is not a working direct image URL. Paste another
                link or leave it blank for the automatic fallback banner.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="job-media-grid">
          {videos.map((value, index) => (
            <label key={index}>
              YouTube Video {index + 1}
              <input
                type="url"
                value={value}
                onChange={(event) =>
                  onYoutubeUrlChange(index, event.target.value)
                }
                placeholder={
                  index === 0
                    ? "First video also supplies the fallback banner thumbnail"
                    : "Optional YouTube video URL"
                }
              />
            </label>
          ))}
        </div>
      </div>

      <style jsx>{`
        .job-media-editor {
          overflow: hidden;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #ffffff;
        }
        summary {
          padding: 20px 20px 14px;
          color: #111827;
          font-size: 17px;
          font-weight: 700;
          cursor: pointer;
        }
        .job-media-body {
          display: grid;
          gap: 16px;
          padding: 0 20px 20px;
          border-top: 1px solid #f3f4f6;
        }
        .job-media-priority {
          margin-top: 14px;
          padding: 10px 12px;
          border-radius: 10px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 13px;
          font-weight: 800;
        }
        .job-media-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }
        label {
          display: grid;
          gap: 6px;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
        }
        input {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px 12px;
          background: #ffffff;
          color: #0f172a;
          font-size: 14px;
          outline: none;
        }
        small {
          color: #64748b;
          font-size: 11px;
          font-weight: 600;
          line-height: 1.45;
        }
        .job-media-preview {
          display: grid;
          grid-template-columns: minmax(0, 260px) auto;
          align-items: center;
          gap: 12px;
        }
        .job-media-preview img {
          width: 100%;
          aspect-ratio: 1200 / 630;
          object-fit: cover;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }
        .job-media-preview button {
          justify-self: start;
          border: 1px solid #fecaca;
          border-radius: 999px;
          padding: 8px 12px;
          background: #fff1f2;
          color: #be123c;
          font-weight: 800;
          cursor: pointer;
        }
        .job-media-preview p {
          grid-column: 1 / -1;
          margin: 0;
          color: #b91c1c;
          font-size: 13px;
          font-weight: 800;
        }
        @media (max-width: 800px) {
          .job-media-grid,
          .job-media-preview {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </details>
  );
}
