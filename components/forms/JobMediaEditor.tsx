"use client";

import { useState } from "react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const uploadImage = async (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be 5 MB or less.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");

      const safeName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const imageRef = ref(
        storage,
        `job-banners/${Date.now()}-${safeName || "job-banner"}`
      );

      await uploadBytes(imageRef, file, {
        contentType: file.type,
      });

      onImageUrlChange(await getDownloadURL(imageRef));
    } catch (error) {
      console.error(error);
      setUploadError(
        "Image upload failed. Check Firebase Storage rules or paste an image URL."
      );
    } finally {
      setUploading(false);
    }
  };

  const videos = [youtubeUrl, youtubeUrl2, youtubeUrl3];

  return (
    <details className="job-media-editor">
      <summary>Banner image and YouTube videos</summary>

      <div className="job-media-body">
        <div className="job-media-priority">
          Banner priority: uploaded image → first YouTube thumbnail → current
          default Job banner.
        </div>

        <div className="job-media-grid">
          <label>
            Upload post image (Priority 1)
            <input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(event) => uploadImage(event.target.files?.[0])}
            />
            <small>{uploading ? "Uploading image…" : "Maximum size: 5 MB"}</small>
          </label>

          <label>
            Or paste image URL
            <input
              type="url"
              value={imageUrl}
              onChange={(event) => onImageUrlChange(event.target.value)}
              placeholder="https://example.com/job-banner.jpg"
            />
            <small>Leave blank to use a YouTube thumbnail or default banner.</small>
          </label>
        </div>

        {uploadError ? <p className="job-media-error">{uploadError}</p> : null}

        {imageUrl.trim() ? (
          <div className="job-media-preview">
            <img src={imageUrl} alt="Selected Job banner preview" />
            <button type="button" onClick={() => onImageUrlChange("")}>
              Remove image
            </button>
          </div>
        ) : null}

        <div className="job-media-grid videos">
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
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #ffffff;
          overflow: hidden;
        }

        summary {
          padding: 14px 16px;
          color: #0f172a;
          font-size: 16px;
          font-weight: 900;
          cursor: pointer;
        }

        .job-media-body {
          display: grid;
          gap: 14px;
          padding: 0 16px 16px;
          border-top: 1px solid #eef2f7;
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
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .job-media-grid.videos {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        label {
          display: grid;
          gap: 6px;
          color: #334155;
          font-size: 13px;
          font-weight: 800;
        }

        input {
          box-sizing: border-box;
          width: 100%;
          min-height: 40px;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 8px 10px;
          background: #ffffff;
          color: #0f172a;
        }

        input[type="file"] {
          padding: 6px;
        }

        small {
          color: #64748b;
          font-size: 11px;
          font-weight: 600;
        }

        .job-media-error {
          margin: 0;
          color: #b91c1c;
          font-size: 13px;
          font-weight: 800;
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

        @media (max-width: 800px) {
          .job-media-grid,
          .job-media-grid.videos {
            grid-template-columns: 1fr;
          }

          .job-media-preview {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </details>
  );
}
