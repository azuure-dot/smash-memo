"use client";

import Link from "next/link";
import { Bookmark, CopyPlus, Link2, NotebookPen } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { GAME_LABELS, GAMES } from "@/lib/game-data";
import type { Game, Matchup, SavedMatchup } from "@/lib/types";

export type Tab = "mine" | "saved";
export type Filter = "all" | Game;
export type MatchupSummary = Pick<
  Matchup,
  "id" | "game" | "my_character" | "opponent_character" | "updated_at" | "is_shared" | "copied_from"
>;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  ...GAMES.map((g) => ({ key: g, label: GAME_LABELS[g] })),
];

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

function urlFor(tab: Tab, filter: Filter) {
  const params = new URLSearchParams();
  if (tab === "saved") params.set("tab", "saved");
  if (filter !== "all") params.set("game", filter);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

/** Tabs and filters run in the browser: switching is instant, no server round trip. */
export function MatchupList({
  matchups,
  saved,
  initialTab,
  initialFilter,
}: {
  matchups: MatchupSummary[];
  saved: SavedMatchup[];
  initialTab: Tab;
  initialFilter: Filter;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [filter, setFilter] = useState<Filter>(initialFilter);

  const source = tab === "mine" ? matchups : saved;
  const visible = filter === "all" ? source : source.filter((m) => m.game === filter);

  function select(nextTab: Tab, nextFilter: Filter) {
    setTab(nextTab);
    setFilter(nextFilter);
    // Keep the URL shareable / reload-safe without triggering a navigation.
    window.history.replaceState(null, "", urlFor(nextTab, nextFilter));
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-line">
        <nav className="flex gap-1" aria-label="Notes">
          {(
            [
              { key: "mine", label: "My Notes", count: matchups.length },
              { key: "saved", label: "Saved Notes", count: saved.length },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => select(t.key, filter)}
              aria-pressed={tab === t.key}
              className={cn(
                "-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition",
                tab === t.key ? "border-brand-to text-fg" : "border-transparent text-muted hover:text-fg",
              )}
            >
              {t.label}
              <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted">
                {t.count}
              </span>
            </button>
          ))}
        </nav>

        <div className="mb-2 inline-flex gap-0.5 rounded-xl bg-surface-2 p-0.5 text-xs" role="group" aria-label="Filter by game">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => select(tab, f.key)}
              aria-pressed={filter === f.key}
              className={cn(
                "rounded-lg px-2.5 py-1 font-medium transition",
                filter === f.key ? "bg-bg text-fg shadow" : "text-muted hover:text-fg",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState tab={tab} filtered={source.length > 0} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((m) => {
            const isSaved = tab === "saved";
            const mine = m as MatchupSummary;
            return (
              <li key={m.id}>
                <Link
                  href={isSaved ? `/share/${m.id}` : `/matchups/${m.id}`}
                  className="group block rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-brand-from/60 hover:shadow-lg hover:shadow-brand-from/10"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                        {GAME_LABELS[m.game]}
                      </span>
                      {isSaved && <Badge icon={<Bookmark className="size-3" />}>Saved</Badge>}
                      {!isSaved && mine.is_shared && <Badge icon={<Link2 className="size-3" />}>Shared</Badge>}
                      {!isSaved && mine.copied_from && <Badge icon={<CopyPlus className="size-3" />}>Copy</Badge>}
                    </div>
                    <span className="shrink-0 text-xs text-muted" suppressHydrationWarning>
                      {timeAgo(m.updated_at)}
                    </span>
                  </div>
                  <p className="truncate text-base font-semibold">
                    {m.my_character}
                    <span className="text-brand mx-2 text-sm font-bold">vs</span>
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
    <span className="inline-flex items-center gap-1 rounded-md border border-brand-from/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-to">
      {icon}
      {children}
    </span>
  );
}

function EmptyState({ tab, filtered }: { tab: Tab; filtered: boolean }) {
  const text = filtered
    ? "Nothing for this game yet."
    : tab === "mine"
      ? "No matchup notes yet. Create your first one above."
      : "No saved notes yet. Open a note someone shared with you and tap “Save to my workspace”.";
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      {tab === "mine" ? (
        <NotebookPen className="size-7 text-muted" aria-hidden />
      ) : (
        <Bookmark className="size-7 text-muted" aria-hidden />
      )}
      <p className="max-w-sm text-sm text-muted">{text}</p>
    </div>
  );
}
