"use client";

import { ExternalLink, MonitorPlay, Play, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { addMatchupVideo } from "@/app/(app)/matchups/[id]/video-actions";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { isTwitchClipUrl } from "@/lib/twitch";
import type { MatchupVideo } from "@/lib/types";
import { parseVideoUrl, PROVIDER_LABEL, providerOf, videoEmbedUrl, videoThumbnailUrl, videoWatchUrl } from "@/lib/videos";
import { formatTimestamp } from "@/lib/youtube";

/** "YouTube video" / "Twitch video" when the site didn't give us a title. */
const fallbackTitle = (video: MatchupVideo) => `${PROVIDER_LABEL[providerOf(video)]} video`;

/**
 * YouTube videos and Twitch VODs / highlights attached to a matchup.
 * Read-only on shared notes (no form, no remove buttons).
 */
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
    // Instant feedback for obvious mistakes; the server checks again (and asks YouTube / Twitch) anyway.
    if (!parseVideoUrl(url)) {
      return setError(
        isTwitchClipUrl(url)
          ? "Twitch clips aren't supported yet, only VODs and highlights."
          : "That doesn't look like a YouTube or Twitch video link.",
      );
    }
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
              name="video_url"
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
              placeholder="Paste a YouTube or Twitch link…"
              aria-label="YouTube or Twitch link"
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
              YouTube videos and Twitch VODs or highlights. Keep the timestamp (e.g. ?t=95) to start there.
              Twitch deletes past broadcasts after 7 to 60 days; highlights stay.
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
                  {video.title ?? fallbackTitle(video)}
                </p>
                <a
                  href={videoWatchUrl(video)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid size-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                  aria-label={`Open on ${PROVIDER_LABEL[providerOf(video)]}`}
                  title={`Open on ${PROVIDER_LABEL[providerOf(video)]}`}
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
 * 16:9 player. Shows the thumbnail first and only loads YouTube's or Twitch's iframe once the viewer presses
 * play: the page stays fast with several videos, and those sites get nothing until then.
 */
function VideoEmbed({ video }: { video: MatchupVideo }) {
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const label = video.title ?? fallbackTitle(video);
  const provider = providerOf(video);
  // Expired Twitch VODs lose their thumbnail: the black frame + play button stay.
  const thumbnail = thumbFailed ? null : videoThumbnailUrl(video);

  return (
    <div className="relative aspect-video overflow-hidden rounded-sm border-[6px] border-surface bg-black shadow-[0_1px_2px_rgb(0_0_0/0.12),0_8px_20px_-10px_rgb(0_0_0/0.35)] ring-1 ring-line">
      {playing ? (
        <iframe
          // Twitch's player needs the page's domain (read here, in the browser, once play is pressed).
          src={videoEmbedUrl(video, window.location.hostname)}
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
          {thumbnail && (
            // Plain <img>: the sites' own thumbnail CDNs, no need for Next's image optimizer.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt=""
              width={480}
              height={provider === "twitch" ? 270 : 360}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setThumbFailed(true)}
              className="size-full object-cover opacity-85 transition-opacity group-hover:opacity-100"
            />
          )}
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-14 place-items-center rounded-full bg-brand text-on-brand shadow-lg shadow-black/20 transition-transform group-hover:scale-110 motion-reduce:transition-none">
              <Play className="ml-0.5 size-6 fill-current" aria-hidden />
            </span>
          </span>
          <span className="absolute bottom-2 left-2 rounded-[3px] bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {PROVIDER_LABEL[provider]}
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
