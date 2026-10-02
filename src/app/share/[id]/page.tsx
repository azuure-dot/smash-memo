import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, Eye, LogIn } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { BrandLogo } from "@/components/brand-logo";
import { AuthorBadge } from "@/components/matchup/author-badge";
import { NoteEditor } from "@/components/matchup/note-editor";
import { QuickNotes } from "@/components/matchup/quick-notes";
import { SharedNoteActions } from "@/components/matchup/shared-note-actions";
import { StageSelector } from "@/components/matchup/stage-selector";
import { GAME_LABELS } from "@/lib/game-data";
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
      <main className="mx-auto max-w-5xl px-4 pb-[calc(env(safe-area-inset-bottom)+4rem)] pt-6 sm:px-6 sm:pt-8">
        <div className="space-y-5">
          <div>
            {signedIn && (
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg"
              >
                <ArrowLeft className="size-4" /> Matchups
              </Link>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                {GAME_LABELS[matchup.game]}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-line px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                <Eye className="size-3" /> Shared · Read-only
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {matchup.my_character}
              <span className="text-brand mx-2.5 text-xl font-bold sm:text-2xl">vs</span>
              {matchup.opponent_character}
            </h1>
            <AuthorBadge author={data.author} />
          </div>

          {signedIn ? (
            <SharedNoteActions id={matchup.id} initialSaved={data.is_saved} />
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl border border-brand-from/40 bg-brand-from/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-fg/85">
                Sign in or create a free account to save this note or duplicate it into your own notes.
              </p>
              <Link
                href={`/login?next=${encodeURIComponent(`/share/${id}`)}`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                <LogIn className="size-4" /> Sign in / Sign up
              </Link>
            </div>
          )}

          <StageSelector matchupId={matchup.id} initialStages={data.stages} readOnly />
          <QuickNotes matchupId={matchup.id} initialNotes={data.quick_notes} readOnly />
          <NoteEditor matchupId={matchup.id} initialContent={matchup.content} readOnly />
        </div>
      </main>
    </>
  );
}

function PublicHeader({ next }: { next: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/login" className="flex items-center" aria-label="Smash Mémo">
          <BrandLogo />
        </Link>
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="flex h-9 items-center rounded-xl px-3 text-sm text-muted transition hover:bg-surface-2 hover:text-fg"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
