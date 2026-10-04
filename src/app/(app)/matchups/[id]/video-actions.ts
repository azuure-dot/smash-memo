"use server";

import { createClient } from "@/lib/supabase/server";
import { isTwitchClipUrl, safeTwitchThumbnail } from "@/lib/twitch";
import type { MatchupVideo } from "@/lib/types";
import { parseVideoUrl } from "@/lib/videos";

const MAX_VIDEOS_PER_NOTE = 20;
const COLUMNS = "id, matchup_id, provider, video_id, title, thumbnail_url, start_seconds, created_at";

export type AddVideoResult = { video?: MatchupVideo; error?: string };

type Lookup = { ok: true; title: string | null; thumbnail: string | null } | { ok: false; error: string };

/**
 * Asks YouTube's public oEmbed endpoint (no API key) whether the video exists and may be embedded,
 * and gets its title. A network problem doesn't block adding the video: it just won't have a title.
 */
async function lookUpYouTube(videoId: string): Promise<Lookup> {
  const watch = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watch)}`, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, error: "This video is private or its owner doesn't allow it to be embedded." };
    }
    if (res.status === 400 || res.status === 404) return { ok: false, error: "This video doesn't exist (anymore)." };
    if (!res.ok) return { ok: true, title: null, thumbnail: null };
    const data = (await res.json()) as { title?: unknown };
    return { ok: true, title: typeof data.title === "string" ? data.title.slice(0, 200) : null, thumbnail: null };
  } catch {
    return { ok: true, title: null, thumbnail: null };
  }
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'" };
const decode = (s: string) =>
  s.replace(/&(amp|lt|gt|quot|apos|#39|#x([0-9a-f]+)|#(\d+));/gi, (m, name: string, hex?: string, dec?: string) =>
    hex ? String.fromCodePoint(parseInt(hex, 16)) : dec ? String.fromCodePoint(Number(dec)) : (ENTITIES[name.toLowerCase()] ?? m),
  );

/** <meta property="og:…" content="…"> tags of a page, whatever the attribute order. */
function openGraph(html: string) {
  const tags: Record<string, string> = {};
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs: Record<string, string> = {};
    for (const m of tag.matchAll(/([a-z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) attrs[m[1].toLowerCase()] = m[2] ?? m[3];
    const key = attrs.property ?? attrs.name;
    if (key?.startsWith("og:") && attrs.content !== undefined && !(key in tags)) tags[key] = decode(attrs.content);
  }
  return tags;
}

/**
 * Twitch has no keyless API, but its video pages carry Open Graph tags (what Discord uses for link previews):
 * title, thumbnail and player. A video that doesn't exist, was deleted or is subscriber-only gets a generic
 * "VOD - Twitch" page with no player. A network problem doesn't block adding the video.
 */
async function lookUpTwitch(videoId: string): Promise<Lookup> {
  try {
    const res = await fetch(`https://www.twitch.tv/videos/${videoId}`, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
      headers: { "User-Agent": "SmashMemo/1.0 (+https://smashmemo.fr)", "Accept-Language": "en" },
    });
    if (!res.ok) return { ok: true, title: null, thumbnail: null };
    const og = openGraph((await res.text()).slice(0, 400_000));
    if (!og["og:video"] && !og["og:video:secure_url"]) {
      return { ok: false, error: "This Twitch video doesn't exist (anymore), or it's subscriber-only." };
    }
    const title = og["og:title"]?.replace(/ on Twitch$/, "").trim().slice(0, 200) || null;
    return { ok: true, title, thumbnail: safeTwitchThumbnail(og["og:image"]) };
  } catch {
    return { ok: true, title: null, thumbnail: null };
  }
}

/** Adds a YouTube video or a Twitch VOD / highlight to one of your notes (RLS rejects notes that aren't yours). */
export async function addMatchupVideo(matchupId: string, url: string): Promise<AddVideoResult> {
  const parsed = parseVideoUrl(url);
  if (!parsed) {
    if (isTwitchClipUrl(url)) return { error: "Twitch clips aren't supported yet, only VODs and highlights." };
    return { error: "That doesn't look like a YouTube or Twitch video link." };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("matchup_videos")
    .select("id", { count: "exact", head: true })
    .eq("matchup_id", matchupId);
  if ((count ?? 0) >= MAX_VIDEOS_PER_NOTE) return { error: `A note can hold up to ${MAX_VIDEOS_PER_NOTE} videos.` };

  const lookup = parsed.provider === "twitch" ? await lookUpTwitch(parsed.videoId) : await lookUpYouTube(parsed.videoId);
  if (!lookup.ok) return { error: lookup.error };

  const { data, error } = await supabase
    .from("matchup_videos")
    .insert({
      matchup_id: matchupId,
      provider: parsed.provider,
      video_id: parsed.videoId,
      title: lookup.title,
      thumbnail_url: lookup.thumbnail,
      start_seconds: parsed.startSeconds,
    })
    .select(COLUMNS)
    .single();

  if (error?.code === "23505") return { error: "This video is already in this note." };
  if (error || !data) return { error: "Couldn't add the video. Check your connection and try again." };
  return { video: data as MatchupVideo };
}
