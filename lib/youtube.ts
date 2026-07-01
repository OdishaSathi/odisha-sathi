export function getYouTubeVideoId(input?: string | null): string | null {
  if (!input) return null;

  const value = input.trim();
  if (!value) return null;

  const cleanId = (id?: string | null) => {
    if (!id) return null;
    const cleaned = id.replace(/[^a-zA-Z0-9_-]/g, "");
    return cleaned.length >= 6 ? cleaned : null;
  };

  try {
    const url = new URL(value);
    const host = url.hostname.replace("www.", "").replace("m.", "");

    if (host === "youtu.be") {
      return cleanId(url.pathname.split("/").filter(Boolean)[0]);
    }

    if (
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtube-nocookie.com" ||
      host.endsWith(".youtube-nocookie.com")
    ) {
      const videoParam = url.searchParams.get("v");
      if (videoParam) return cleanId(videoParam);

      const parts = url.pathname.split("/").filter(Boolean);

      if (
        parts[0] === "embed" ||
        parts[0] === "shorts" ||
        parts[0] === "live"
      ) {
        return cleanId(parts[1]);
      }
    }
  } catch {
    const match = value.match(
      /(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/)([a-zA-Z0-9_-]+)/
    );

    if (match?.[1]) {
      return cleanId(match[1]);
    }
  }

  return null;
}

export function getYouTubeThumbnailUrl(input?: string | null): string | null {
  const videoId = getYouTubeVideoId(input);
  if (!videoId) return null;

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function getYouTubeWatchUrl(input?: string | null): string | null {
  const videoId = getYouTubeVideoId(input);
  if (!videoId) return null;

  return `https://www.youtube.com/watch?v=${videoId}`;
}