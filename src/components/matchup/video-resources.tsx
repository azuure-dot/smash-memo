"use client";

import { ExternalLink, MonitorPlay, Play, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { addMatchupVideo } from "@/app/(app)/matchups/[id]/video-actions";
import { cn } from "@/lib/cn";
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
    <section className="paper rounded-lg p-4 sm:p-6" aria-labelledby="videos-title">
      <div className="mb-4 flex items-center gap-2.5">
        <MonitorPlay className="size-4 text-muted" aria-hidden />
        <h2 id="videos-title" className="font-serif text-lg font-semibold">
          Video Resources
          {videos.length > 0 && (
            <span className="ml-2 font-sans text-xs font-normal tabular-nums text-muted">({videos.length})</span>
          )}
        </h2>
      </div>

      {!readOnly && (
        <form onSubmit={add} className="mb-4">
          <div className="flex items-end gap-3">
            <input
              name="youtube_url"
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
              placeholder="Paste a YouTube link…"
              aria-label="YouTube link"
              aria-invalid={Boolean(error)}
              // A line to write on, like the rest of the notebook.
              className="min-w-0 flex-1 border-0 border-b border-line bg-transparent px-1 py-2 font-serif text-[15px] outline-none transition-colors placeholder:text-muted focus-visible:border-fg/60 aria-[invalid=true]:border-avoid"
            />
            <button
              type="submit"
              disabled={!url.trim() || pending}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-md bg-brand px-4 text-sm font-semibold text-on-brand transition-[filter,opacity] hover:brightness-110 disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden />
              <span className="hidden sm:inline">{pending ? "Adding…" : "Add Video"}</span>
              <span className="sm:hidden">{pending ? "…" : "Add"}</span>
            </button>
          </div>
          {error ? (
            <p className="mt-2 text-sm text-avoid" role="alert">
              {error}
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted">
              youtube.com, youtu.be, Shorts and embed links work. Keep the timestamp (e.g. ?t=95) to start there.
            </p>
          )}
        </form>
      )}

      {videos.length === 0 ? (
        <p className="rounded-md border border-dashed border-line px-4 py-8 text-center font-serif text-sm italic text-muted">
          No videos yet. Add a VOD, a guide or a combo video for this matchup.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {videos.map((video, i) => (
            // Taped into the notebook like printed photos, each one slightly askew.
            <li key={video.id} className={cn("relative", i % 2 ? "sm:rotate-[0.6deg]" : "sm:-rotate-[0.6deg]")}>
              <span
                aria-hidden
                className="absolute -top-2.5 left-1/2 z-10 h-5 w-20 -translate-x-1/2 -rotate-2 bg-brand-from/20 backdrop-blur-[1px]"
              />
              <VideoEmbed video={video} />
              <div className="mt-2 flex items-start gap-2">
                <p className="line-clamp-2 min-w-0 flex-1 font-serif text-sm leading-snug">
                  {video.title ?? "YouTube video"}
                </p>
                <a
                  href={youTubeWatchUrl(video.video_id, video.start_seconds)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid size-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                  aria-label="Open on YouTube"
                  title="Open on YouTube"
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                </a>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => confirm(`Remove “${video.title ?? "this video"}” from this note?`) && remove(video)}
                    className="grid size-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-avoid/10 hover:text-avoid"
                    aria-label={`Remove ${video.title ?? "video"}`}
                    title="Remove"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {readOnly && error && <p className="mt-2 text-sm text-avoid" role="alert">{error}</p>}
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
    <div className="relative aspect-video overflow-hidden rounded-sm border-[6px] border-surface bg-black shadow-[0_1px_2px_rgb(0_0_0/0.12),0_8px_20px_-10px_rgb(0_0_0/0.35)] ring-1 ring-line">
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
            width={480}
            height={360}
            loading="lazy"
            className="size-full object-cover opacity-85 transition-opacity group-hover:opacity-100"
          />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-14 place-items-center rounded-full bg-brand text-on-brand shadow-lg shadow-black/20 transition-transform group-hover:scale-110 motion-reduce:transition-none">
              <Play className="ml-0.5 size-6 fill-current" aria-hidden />
            </span>
          </span>
          {video.start_seconds ? (
            <span className="absolute bottom-2 right-2 rounded-sm bg-black/75 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
              from {formatTimestamp(video.start_seconds)}
            </span>
          ) : null}
        </button>
      )}
    </div>
  );
}
