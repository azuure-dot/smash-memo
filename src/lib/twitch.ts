/** Twitch VOD and highlight ids are plain numbers (twitch.tv/videos/2873706344). */
const VIDEO_ID = /^\d{1,15}$/;

const TWITCH_HOSTS = new Set(["twitch.tv", "www.twitch.tv", "m.twitch.tv", "go.twitch.tv", "player.twitch.tv"]);

/** Thumbnails are only ever loaded from Twitch's image server (same rule as the database check). */
const THUMBNAIL = /^https:\/\/static-cdn\.jtvnw\.net\/[A-Za-z0-9_./%-]+$/;

export type ParsedTwitch = { videoId: string; startSeconds: number | null };

/** "95", "95s", "1m35s", "1h2m3s" → seconds. */
function parseTime(value: string | null): number | null {
  if (!value) return null;
  if (/^\d+s?$/.test(value)) return Number.parseInt(value, 10);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  if (!m || !m[0]) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

function toUrl(input: string): URL | null {
  let raw = input.trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

/**
 * Extracts the video id (and start time) of a Twitch VOD or highlight: twitch.tv/videos/ID (www., m.),
 * the old twitch.tv/<channel>/v/ID and /video/ID forms, and player.twitch.tv/?video=ID.
 * With or without "https://". Returns null for anything else (channels, clips…).
 */
export function parseTwitchUrl(input: string): ParsedTwitch | null {
  const url = toUrl(input);
  if (!url || !TWITCH_HOSTS.has(url.hostname.toLowerCase())) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  let id: string | null = null;
  if (url.hostname.toLowerCase() === "player.twitch.tv") id = url.searchParams.get("video")?.replace(/^v/, "") ?? null;
  else if (segments[0] === "videos") id = segments[1] ?? null;
  else if (segments[1] === "v" || segments[1] === "video") id = segments[2] ?? null;

  if (!id || !VIDEO_ID.test(id)) return null;
  const start = parseTime(url.searchParams.get("t") ?? url.searchParams.get("time"));
  return { videoId: id, startSeconds: start && start > 0 && start <= 86400 ? start : null };
}

/** Clips (clips.twitch.tv/…, twitch.tv/<channel>/clip/…) aren't supported: used for a clearer error message. */
export function isTwitchClipUrl(input: string) {
  const url = toUrl(input);
  if (!url) return false;
  const host = url.hostname.toLowerCase();
  return host === "clips.twitch.tv" || (TWITCH_HOSTS.has(host) && url.pathname.split("/")[2] === "clip");
}

/** 3725 → "1h2m5s", the time format of Twitch's player and links. */
function twitchTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h${m}m${seconds % 60}s`;
}

/**
 * Twitch's player only runs inside the sites listed in `parent`: the domain the page is served from
 * (smashmemo.fr, localhost…), so it is read in the browser when the viewer presses play.
 */
export function twitchEmbedUrl(videoId: string, startSeconds: number | null | undefined, parent: string) {
  const params = new URLSearchParams({ video: videoId, parent, autoplay: "true" });
  if (startSeconds) params.set("time", twitchTime(startSeconds));
  return `https://player.twitch.tv/?${params}`;
}

export function twitchWatchUrl(videoId: string, startSeconds?: number | null) {
  return `https://www.twitch.tv/videos/${videoId}${startSeconds ? `?t=${twitchTime(startSeconds)}` : ""}`;
}

/** The stored thumbnail if it's a Twitch image address, otherwise null. */
export function safeTwitchThumbnail(url: unknown): string | null {
  return typeof url === "string" && url.length <= 500 && THUMBNAIL.test(url) ? url : null;
}
