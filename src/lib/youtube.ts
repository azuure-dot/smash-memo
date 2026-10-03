/** YouTube video ids are always 11 characters from this alphabet. */
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

export type ParsedYouTube = { videoId: string; startSeconds: number | null };

/** "90", "90s", "1m30s", "1h2m3s" → seconds. */
function parseTime(value: string | null): number | null {
  if (!value) return null;
  if (/^\d+s?$/.test(value)) return Number.parseInt(value, 10);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  if (!m || !m[0]) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

/**
 * Extracts the video id (and start time, if any) from the usual YouTube link formats:
 * youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, /shorts/ID, /live/ID, /v/ID,
 * m./music./nocookie variants, with or without "https://". Returns null for anything else.
 */
export function parseYouTubeUrl(input: string): ParsedYouTube | null {
  let raw = input.trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);
  let id: string | null = null;

  if (host === "youtu.be") {
    id = segments[0] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (segments[0] === "watch") id = url.searchParams.get("v");
    else if (["embed", "shorts", "live", "v"].includes(segments[0] ?? "")) id = segments[1] ?? null;
  }

  if (!id || !VIDEO_ID.test(id)) return null;
  const start = parseTime(url.searchParams.get("t") ?? url.searchParams.get("start"));
  return { videoId: id, startSeconds: start && start > 0 && start <= 86400 ? start : null };
}

/** Privacy-enhanced embed: YouTube sets no cookies until the viewer plays the video. */
export function youTubeEmbedUrl(videoId: string, startSeconds?: number | null) {
  const params = new URLSearchParams({ autoplay: "1", rel: "0", modestbranding: "1" });
  if (startSeconds) params.set("start", String(startSeconds));
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
}

export function youTubeThumbnailUrl(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function youTubeWatchUrl(videoId: string, startSeconds?: number | null) {
  return `https://www.youtube.com/watch?v=${videoId}${startSeconds ? `&t=${startSeconds}s` : ""}`;
}

/** 95 → "1:35", 3725 → "1:02:05". */
export function formatTimestamp(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
