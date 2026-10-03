"use server";

import { createClient } from "@/lib/supabase/server";
import type { MatchupVideo } from "@/lib/types";
import { parseYouTubeUrl } from "@/lib/youtube";

const MAX_VIDEOS_PER_NOTE = 20;
const COLUMNS = "id, matchup_id, video_id, title, start_seconds, created_at";

export type AddVideoResult = { video?: MatchupVideo; error?: string };

/**
 * Asks YouTube's public oEmbed endpoint (no API key) whether the video exists and may be embedded,
 * and gets its title. A network problem doesn't block adding the video: it just won't have a title.
 */
async function lookUpVideo(videoId: string): Promise<{ ok: true; title: string | null } | { ok: false; error: string }> {
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
    if (!res.ok) return { ok: true, title: null };
    const data = (await res.json()) as { title?: unknown };
    return { ok: true, title: typeof data.title === "string" ? data.title.slice(0, 200) : null };
  } catch {
    return { ok: true, title: null };
  }
}

/** Adds a YouTube video to one of your notes (RLS rejects notes that aren't yours). */
export async function addMatchupVideo(matchupId: string, url: string): Promise<AddVideoResult> {
  const parsed = parseYouTubeUrl(url);
  if (!parsed) return { error: "That doesn't look like a YouTube video link." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("matchup_videos")
    .select("id", { count: "exact", head: true })
    .eq("matchup_id", matchupId);
  if ((count ?? 0) >= MAX_VIDEOS_PER_NOTE) return { error: `A note can hold up to ${MAX_VIDEOS_PER_NOTE} videos.` };

  const lookup = await lookUpVideo(parsed.videoId);
  if (!lookup.ok) return { error: lookup.error };

  const { data, error } = await supabase
    .from("matchup_videos")
    .insert({
      matchup_id: matchupId,
      video_id: parsed.videoId,
      title: lookup.title,
      start_seconds: parsed.startSeconds,
    })
    .select(COLUMNS)
    .single();

  if (error?.code === "23505") return { error: "This video is already in this note." };
  if (error || !data) return { error: "Couldn't add the video. Check your connection and try again." };
  return { video: data as MatchupVideo };
}
