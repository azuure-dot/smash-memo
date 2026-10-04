import { parseTwitchUrl, safeTwitchThumbnail, twitchEmbedUrl, twitchWatchUrl } from "./twitch";
import type { MatchupVideo, VideoProvider } from "./types";
import { parseYouTubeUrl, youTubeEmbedUrl, youTubeThumbnailUrl, youTubeWatchUrl } from "./youtube";

export type ParsedVideo = { provider: VideoProvider; videoId: string; startSeconds: number | null };

/** A YouTube video or a Twitch VOD / highlight link → which site, which video, where to start. */
export function parseVideoUrl(input: string): ParsedVideo | null {
  const yt = parseYouTubeUrl(input);
  if (yt) return { provider: "youtube", ...yt };
  const tw = parseTwitchUrl(input);
  if (tw) return { provider: "twitch", ...tw };
  return null;
}

export const PROVIDER_LABEL: Record<VideoProvider, string> = { youtube: "YouTube", twitch: "Twitch" };

/** Rows created before Twitch support have no provider: they're YouTube videos. */
export const providerOf = (video: Pick<MatchupVideo, "provider">): VideoProvider =>
  video.provider === "twitch" ? "twitch" : "youtube";

export function videoWatchUrl(video: MatchupVideo) {
  return providerOf(video) === "twitch"
    ? twitchWatchUrl(video.video_id, video.start_seconds)
    : youTubeWatchUrl(video.video_id, video.start_seconds);
}

/** Player address. `host` = the page's domain, required by Twitch's player. */
export function videoEmbedUrl(video: MatchupVideo, host: string) {
  return providerOf(video) === "twitch"
    ? twitchEmbedUrl(video.video_id, video.start_seconds, host)
    : youTubeEmbedUrl(video.video_id, video.start_seconds);
}

export function videoThumbnailUrl(video: MatchupVideo): string | null {
  return providerOf(video) === "twitch" ? safeTwitchThumbnail(video.thumbnail_url) : youTubeThumbnailUrl(video.video_id);
}
