"use client";

import { useState } from "react";
import {
  getYouTubeThumbnailUrl,
  getYouTubeVideoId,
  getYouTubeWatchUrl,
} from "@/lib/youtube";

type YouTubePreviewCardProps = {
  youtubeUrl?: string | null;
};

function YouTubePreviewCard({ youtubeUrl }: YouTubePreviewCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const videoId = getYouTubeVideoId(youtubeUrl);
  const thumbnailUrl = getYouTubeThumbnailUrl(youtubeUrl);
  const watchUrl = getYouTubeWatchUrl(youtubeUrl);

  if (!videoId || !watchUrl) {
    return null;
  }

  return (
    <section
      style={{
        marginTop: "24px",
        border: "1px solid #e5e7eb",
        borderRadius: "18px",
        overflow: "hidden",
        background: "#ffffff",
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid #e5e7eb",
          background: "#f8fafc",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "18px",
            color: "#111827",
            fontWeight: 800,
          }}
        >
          YouTube Video Preview
        </h2>
      </div>

      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            background: "#111827",
            overflow: "hidden",
          }}
        >
          {!imageFailed && thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="YouTube video thumbnail"
              onError={() => setImageFailed(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "grid",
                placeItems: "center",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "20px",
              }}
            >
              YouTube Video
            </div>
          )}

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.35))",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "52px",
                borderRadius: "16px",
                background: "#dc2626",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
              }}
            >
              <span
                style={{
                  width: 0,
                  height: 0,
                  borderTop: "12px solid transparent",
                  borderBottom: "12px solid transparent",
                  borderLeft: "20px solid #ffffff",
                  marginLeft: "5px",
                }}
              />
            </div>
          </div>
        </div>
      </a>

      <div
        style={{
          padding: "14px 16px 16px",
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#475569",
            fontSize: "14px",
            lineHeight: 1.5,
          }}
        >
          Watch the related video update on YouTube.
        </p>

        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "40px",
            padding: "9px 14px",
            borderRadius: "999px",
            background: "#dc2626",
            color: "#ffffff",
            fontWeight: 800,
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          Open YouTube
        </a>
      </div>
    </section>
  );
}

export default YouTubePreviewCard;