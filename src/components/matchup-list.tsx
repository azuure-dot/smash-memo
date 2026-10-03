"use client";

import Link from "next/link";
import { Bookmark, CopyPlus, Link2, NotebookPen } from "lucide-react";
import { cn } from "@/lib/cn";
import { GAME_LABELS } from "@/lib/game-data";
import type { Game, Matchup, SavedMatchup } from "@/lib/types";

export type Tab = "mine" | "saved";
export type MatchupSummary = Pick<
  Matchup,
  "id" | "game" | "my_character" | "opponent_character" | "updated_at" | "is_shared" | "copied_from"
>;

function timeAgo(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000], ["month", 2592000], ["week", 604800],
    ["day", 86400], ["hour", 3600], ["minute", 60],
  ];
  for (const [unit, secs] of steps) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return "just now";
}

/** "My Notes" / "Saved Notes" for the game picked in the dashboard's game selector (already filtered). */
export function MatchupList({
  game,
  tab,
  onTabChange,
  matchups,
  saved,
}: {
  game: Game;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  matchups: MatchupSummary[];
  saved: SavedMatchup[];
}) {
  const visible = tab === "mine" ? matchups : saved;

  return (
    <>
      <nav className="flex gap-1 border-b border-line" aria-label="Notes">
        {(
          [
            { key: "mine", label: "My Notes", count: matchups.length },
            { key: "saved", label: "Saved Notes", count: saved.length },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => onTabChange(t.key)}
            aria-pressed={tab === t.key}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
              tab === t.key ? "border-brand-from text-fg" : "border-transparent text-muted hover:text-fg",
            )}
          >
            {t.label}
            <span className="text-xs font-normal tabular-nums text-muted">({t.count})</span>
          </button>
        ))}
      </nav>

      {visible.length === 0 ? (
        <EmptyState tab={tab} game={game} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((m) => {
            const isSaved = tab === "saved";
            const mine = m as MatchupSummary;
            const badges = [
              isSaved && <Badge key="saved" icon={<Bookmark className="size-3" aria-hidden />}>Saved</Badge>,
              !isSaved && mine.is_shared && <Badge key="shared" icon={<Link2 className="size-3" aria-hidden />}>Shared</Badge>,
              !isSaved && mine.copied_from && <Badge key="copy" icon={<CopyPlus className="size-3" aria-hidden />}>Copy</Badge>,
            ].filter(Boolean);
            return (
              <li key={m.id}>
                <Link
                  href={isSaved ? `/share/${m.id}` : `/matchups/${m.id}`}
                  // An index card on the desk: lifts slightly on hover, no glow.
                  className="paper group block rounded-lg p-4 transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-fg/30 active:scale-[0.99] motion-reduce:transition-none"
                >
                  <div className="mb-3 flex min-h-5 items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">{badges}</div>
                    <span className="shrink-0 text-xs text-muted" suppressHydrationWarning>
                      {timeAgo(m.updated_at)}
                    </span>
                  </div>
                  <p className="truncate font-serif text-lg font-semibold">
                    {m.my_character}
                    <span className="mx-2 font-hand text-xl font-bold text-brand">vs</span>
                    {m.opponent_character}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Badge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex -rotate-1 items-center gap-1 rounded-[3px] border border-brand-from/60 px-1.5 py-px text-[10px] font-bold uppercase tracking-[0.12em] text-brand">
      {icon}
      {children}
    </span>
  );
}

function EmptyState({ tab, game }: { tab: Tab; game: Game }) {
  const label = GAME_LABELS[game];
  const text =
    tab === "mine"
      ? `No ${label} notes yet. Create your first one above.`
      : `No saved ${label} notes yet. Open a note someone shared with you and tap “Save to my workspace”.`;
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-14 text-center">
      {tab === "mine" ? (
        <NotebookPen className="size-7 text-muted" aria-hidden />
      ) : (
        <Bookmark className="size-7 text-muted" aria-hidden />
      )}
      <p className="max-w-sm text-balance font-serif text-[15px] italic text-muted">{text}</p>
    </div>
  );
}
