import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { ArrowLeft } from "lucide-react";
import { AuthorBadge } from "@/components/matchup/author-badge";
import { DeleteMatchupButton } from "@/components/matchup/delete-matchup-button";
import { NoteEditor } from "@/components/matchup/note-editor";
import { PresetReminder } from "@/components/matchup/preset-reminder";
import { ShareButton } from "@/components/matchup/share-button";
import { StageSelector } from "@/components/matchup/stage-selector";
import { VideoResources } from "@/components/matchup/video-resources";
import { GameStamp } from "@/components/game-stamp";
import { MatchupLabel } from "@/components/matchup-label";
import { dashboardHref } from "@/lib/game-data";
import { createClient } from "@/lib/supabase/server";
import type { Matchup, MatchupStage, MatchupVideo, Profile } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Shared by generateMetadata and the page: one query per request instead of two. */
const getMatchup = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("matchups").select("*").eq("id", id).maybeSingle();
  return data as Matchup | null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!UUID.test(id)) return {};
  const data = await getMatchup(id);
  return data ? { title: `${data.my_character} vs ${data.opponent_character}` } : {};
}

export default async function MatchupPage({ params }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [matchup, stagesRes, profileRes, videosRes] = await Promise.all([
    getMatchup(id),
    supabase
      .from("matchup_stages")
      .select("id, matchup_id, name, status, is_custom, position")
      .eq("matchup_id", id)
      .order("position"),
    // RLS only returns the signed-in user's own profile row.
    supabase.from("profiles").select("username, avatar_url").maybeSingle(),
    supabase
      .from("matchup_videos")
      .select("id, matchup_id, video_id, title, start_seconds, created_at")
      .eq("matchup_id", id)
      .order("created_at"),
  ]);

  // Not one of yours: it may be someone else's shared note, whose read-only view lives at /share/[id].
  if (!matchup) redirect(`/share/${id}`);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={dashboardHref(matchup.game)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg"
        >
          <ArrowLeft className="size-4" /> Matchups
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <GameStamp game={matchup.game} />
            {/* The page title is the matchup's post-it, with the character icons. */}
            <MatchupLabel
              as="h1"
              variant="title"
              id={matchup.id}
              game={matchup.game}
              mine={matchup.my_character}
              opponent={matchup.opponent_character}
              className="mt-5"
            />
            {/* What visitors of the share link see. */}
            {matchup.is_shared && <AuthorBadge author={profileRes.data as Profile | null} isYou />}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ShareButton id={matchup.id} initialShared={matchup.is_shared} />
            <DeleteMatchupButton id={matchup.id} />
          </div>
        </div>
      </div>

      {/* A. Pre-set reminder — the very first thing under the title, read right before the set */}
      <PresetReminder matchupId={matchup.id} initialText={matchup.preset_reminder ?? null} />

      {/* B. Stage preferences */}
      <StageSelector matchupId={matchup.id} initialStages={(stagesRes.data ?? []) as MatchupStage[]} />

      {/* C. Rich text notes */}
      <NoteEditor matchupId={matchup.id} initialContent={matchup.content} />

      {/* D. YouTube videos (VODs, guides…) */}
      <VideoResources matchupId={matchup.id} initialVideos={(videosRes.data ?? []) as MatchupVideo[]} />
    </div>
  );
}
