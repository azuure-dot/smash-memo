"use client";

import { ExternalLink, MonitorPlay, Play, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { addMatchupVideo } from "@/app/(app)/matchups/[id]/video-actions";
import { createClient } from "@/lib/supabase/client";
import type { MatchupVideo } from "@/lib/types";
import { formatTimestamp, parseYouTubeUrl, youTubeEmbedUrl, youTubeThumbnailUrl, youTubeWatchUrl } from "@/lib/youtube";

/** YouTube videos attached to a matchup. Read-only on shared notes (no form, no remove buttons). */
export function VideoResources({
  matchupId,
  initialVideos,
  readOnly = false,
}: {
  matchupId: string;
  initialVideos: MatchupVideo[];
  readOnly?: boolean;
}) {
  const supabase = createClient();
  const [videos, setVideos] = useState(initialVideos);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (readOnly && videos.length === 0) return null;

  function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Instant feedback for obvious mistakes; the server checks again (and asks YouTube) anyway.
    if (!parseYouTubeUrl(url)) return setError("That doesn't look like a YouTube video link.");
    startTransition(async () => {
      const res = await addMatchupVideo(matchupId, url);
      if (res.error || !res.video) return setError(res.error ?? "Couldn't add the video.");
      setVideos((v) => [...v, res.video!]);
      setUrl("");
    });
  }

  async function remove(video: MatchupVideo) {
    const before = videos;
    setError(null);
    setVideos((v) => v.filter((x) => x.id !== video.id));
    const { error } = await supabase.from("matchup_videos").delete().eq("id", video.id);
    if (error) {
      setVideos(before);
      setError("Couldn't remove that video.");
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 sm:p-5" aria-labelledby="videos-title">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-8 place-items-center rounded-lg bg-surface-2 text-muted">
          <MonitorPlay className="size-4" />
        </span>
        <h2 id="videos-title" className="font-semibold">
          Video Resources
          {videos.length > 0 && (
            <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-normal text-muted">{videos.length}</span>
          )}
        </h2>
      </div>

      {!readOnly && (
        <form onSubmit={add} className="mb-4">
          <div className="flex gap-2">
            <input
              // Plain text (with the URL keyboard on mobile): type="url" would reject links without "https://".
              type="text"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              placeholder="Paste a YouTube link (VOD, guide, combo video…)"
              aria-label="YouTube link"
              aria-invalid={Boolean(error)}
              className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-brand-from aria-[invalid=true]:border-red-500/70"
            />
            <button
              type="submit"
              disabled={!url.trim() || pending}
              className="flex h-[42px] shrink-0 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">{pending ? "Adding…" : "Add Video"}</span>
              <span className="sm:hidden">{pending ? "…" : "Add"}</span>
            </button>
          </div>
          {error ? (
            <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-muted">
              youtube.com, youtu.be, Shorts and embed links work. Keep the timestamp (e.g. ?t=95) to start there.
            </p>
          )}
        </form>
      )}

      {videos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
          No videos yet. Add a VOD, a guide or a combo video for this matchup.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {videos.map((video) => (
            <li key={video.id}>
              <VideoEmbed video={video} />
              <div className="mt-2 flex items-start gap-2">
                <p className="line-clamp-2 min-w-0 flex-1 text-sm font-medium leading-snug">
                  {video.title ?? "YouTube video"}
                </p>
                <a
                  href={youTubeWatchUrl(video.video_id, video.start_seconds)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid size-7 shrink-0 place-items-center rounded-md text-muted transition hover:bg-surface-2 hover:text-fg"
                  aria-label="Open on YouTube"
                  title="Open on YouTube"
                >
                  <ExternalLink className="size-3.5" />
                </a>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => remove(video)}
                    className="grid size-7 shrink-0 place-items-center rounded-md text-muted transition hover:bg-red-500/10 hover:text-red-400"
                    aria-label={`Remove ${video.title ?? "video"}`}
                    title="Remove"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {readOnly && error && <p className="mt-2 text-sm text-red-400" role="alert">{error}</p>}
    </section>
  );
}

/**
 * 16:9 player. Shows the thumbnail first and only loads YouTube's iframe once the viewer presses play:
 * the page stays fast with several videos, and YouTube gets nothing until then.
 */
function VideoEmbed({ video }: { video: MatchupVideo }) {
  const [playing, setPlaying] = useState(false);
  const label = video.title ?? "YouTube video";

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-black">
      {playing ? (
        <iframe
          src={youTubeEmbedUrl(video.video_id, video.start_seconds)}
          title={label}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 size-full"
          aria-label={`Play ${label}`}
        >
          {/* Plain <img>: YouTube's own thumbnail CDN, no need for Next's image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={youTubeThumbnailUrl(video.video_id)}
            alt=""
            loading="lazy"
            className="size-full object-cover opacity-80 transition group-hover:opacity-100"
          />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-14 place-items-center rounded-full bg-brand text-white shadow-lg shadow-black/50 transition group-hover:scale-110">
              <Play className="ml-0.5 size-6 fill-current" />
            </span>
          </span>
          {video.start_seconds ? (
            <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white">
              from {formatTimestamp(video.start_seconds)}
            </span>
          ) : null}
        </button>
      )}
    </div>
  );
}
