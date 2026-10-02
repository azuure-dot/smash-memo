import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { ArrowLeft } from "lucide-react";
import { DeleteMatchupButton } from "@/components/matchup/delete-matchup-button";
import { NoteEditor } from "@/components/matchup/note-editor";
import { QuickNotes } from "@/components/matchup/quick-notes";
import { ShareButton } from "@/components/matchup/share-button";
import { StageSelector } from "@/components/matchup/stage-selector";
import { GAME_LABELS } from "@/lib/game-data";
import { createClient } from "@/lib/supabase/server";
import type { Matchup, MatchupStage, QuickNote } from "@/lib/types";

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
  const [matchup, stagesRes, notesRes] = await Promise.all([
    getMatchup(id),
    supabase
      .from("matchup_stages")
      .select("id, matchup_id, name, status, is_custom, position")
      .eq("matchup_id", id)
      .order("position"),
    supabase
      .from("quick_notes")
      .select("id, matchup_id, body, created_at, updated_at")
      .eq("matchup_id", id)
      .order("created_at"),
  ]);

  // Not one of yours: it may be someone else's shared note, whose read-only view lives at /share/[id].
  if (!matchup) redirect(`/share/${id}`);

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg"
        >
          <ArrowLeft className="size-4" /> Matchups
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
              {GAME_LABELS[matchup.game]}
            </span>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {matchup.my_character}
              <span className="text-brand mx-2.5 text-xl font-bold sm:text-2xl">vs</span>
              {matchup.opponent_character}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ShareButton id={matchup.id} initialShared={matchup.is_shared} />
            <DeleteMatchupButton id={matchup.id} />
          </div>
        </div>
      </div>

      {/* A. Stage preferences */}
      <StageSelector matchupId={matchup.id} initialStages={(stagesRes.data ?? []) as MatchupStage[]} />

      {/* C. Quick notes — collapsed by default, kept above the long-form notes for mid-set access */}
      <QuickNotes matchupId={matchup.id} initialNotes={(notesRes.data ?? []) as QuickNote[]} />

      {/* B. Rich text notes */}
      <NoteEditor matchupId={matchup.id} initialContent={matchup.content} />
    </div>
  );
}
