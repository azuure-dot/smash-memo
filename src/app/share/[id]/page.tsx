import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, Eye, LogIn } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { BrandLogo } from "@/components/brand-logo";
import { AuthorBadge } from "@/components/matchup/author-badge";
import { NoteEditor } from "@/components/matchup/note-editor";
import { PresetReminder } from "@/components/matchup/preset-reminder";
import { SharedNoteActions } from "@/components/matchup/shared-note-actions";
import { StageSelector } from "@/components/matchup/stage-selector";
import { VideoResources } from "@/components/matchup/video-resources";
import { GameStamp } from "@/components/game-stamp";
import { dashboardHref, DEFAULT_GAME } from "@/lib/game-data";
import { createClient } from "@/lib/supabase/server";
import type { SharedMatchup } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reads a note through get_shared_matchup(): only works if it's shared (or yours). */
const getShared = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_shared_matchup", { p_id: id });
  return (data ?? null) as SharedMatchup | null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const data = UUID.test(id) ? await getShared(id) : null;
  return {
    title: data ? `${data.matchup.my_character} vs ${data.matchup.opponent_character}` : "Shared note",
    robots: { index: false, follow: false }, // share links shouldn't end up in search engines
  };
}

export default async function SharedMatchupPage({ params }: Props) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [data, { data: auth }] = await Promise.all([getShared(id), supabase.auth.getClaims()]);
  if (!data) notFound();
  // The author always gets their editable version.
  if (data.is_owner) redirect(`/matchups/${id}`);

  const signedIn = Boolean(auth?.claims);
  const { matchup } = data;

  return (
    <>
      {signedIn ? <AppHeader /> : <PublicHeader next={`/share/${id}`} />}
      <main
        id="main"
        className="mx-auto max-w-5xl scroll-mt-20 px-4 pb-[calc(env(safe-area-inset-bottom)+4rem)] pt-6 sm:px-6 sm:pt-8"
      >
        <div className="space-y-5">
          <div>
            {signedIn && (
              <Link
                href={`${dashboardHref(matchup.game)}${matchup.game === DEFAULT_GAME ? "?" : "&"}tab=saved`}
                className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
              >
                <ArrowLeft className="size-4" aria-hidden /> Matchups
              </Link>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <GameStamp game={matchup.game} />
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <Eye className="size-3.5" aria-hidden /> Shared, read-only
              </span>
            </div>
            <h1 className="mt-3 text-balance break-words font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              {matchup.my_character}
              <span className="mx-2.5 font-hand text-[1.15em] font-bold text-brand">vs</span>
              {matchup.opponent_character}
            </h1>
            <AuthorBadge author={data.author} />
          </div>

          {signedIn ? (
            <SharedNoteActions id={matchup.id} initialSaved={data.is_saved} />
          ) : (
            <div className="paper flex flex-col gap-3 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-fg/85">
                Sign in or create a free account to save this note or duplicate it into your own notes.
              </p>
              <Link
                href={`/login?next=${encodeURIComponent(`/share/${id}`)}`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
              >
                <LogIn className="size-4" aria-hidden /> Sign In or Sign Up
              </Link>
            </div>
          )}

          <PresetReminder matchupId={matchup.id} initialText={matchup.preset_reminder ?? null} readOnly />
          <StageSelector matchupId={matchup.id} initialStages={data.stages} readOnly />
          <NoteEditor matchupId={matchup.id} initialContent={matchup.content} readOnly />
          <VideoResources matchupId={matchup.id} initialVideos={data.videos ?? []} readOnly />
        </div>
      </main>
    </>
  );
}

function PublicHeader({ next }: { next: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/login" className="flex items-center" aria-label="Smash Memo">
          <BrandLogo />
        </Link>
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="flex h-9 items-center rounded-md px-3 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          Sign In
        </Link>
      </div>
    </header>
  );
}
