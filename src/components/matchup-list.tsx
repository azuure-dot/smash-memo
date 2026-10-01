"use client";

import Link from "next/link";
import { NotebookPen } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { GAME_LABELS } from "@/lib/game-data";
import type { Game, Matchup } from "@/lib/types";

export type Filter = "all" | Game;
export type MatchupSummary = Pick<Matchup, "id" | "game" | "my_character" | "opponent_character" | "updated_at">;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ultimate", label: "Ultimate" },
  { key: "melee", label: "Melee" },
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

/** Filters in the browser: switching tabs is instant, no server round trip. */
export function MatchupList({ matchups, initialFilter }: { matchups: MatchupSummary[]; initialFilter: Filter }) {
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const visible = filter === "all" ? matchups : matchups.filter((m) => m.game === filter);

  function select(next: Filter) {
    setFilter(next);
    // Keep the URL shareable / reload-safe without triggering a navigation.
    window.history.replaceState(null, "", next === "all" ? "/" : `/?game=${next}`);
  }

  return (
    <>
      <nav className="flex gap-1 border-b border-line" aria-label="Filter by game">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => select(f.key)}
            aria-pressed={filter === f.key}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition",
              filter === f.key ? "border-brand-to text-fg" : "border-transparent text-muted hover:text-fg",
            )}
          >
            {f.label}
          </button>
        ))}
      </nav>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
          <NotebookPen className="size-7 text-muted" aria-hidden />
          <p className="text-sm text-muted">No matchup notes yet. Create your first one above.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((m) => (
            <li key={m.id}>
              <Link
                href={`/matchups/${m.id}`}
                className="group block rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-brand-from/60 hover:shadow-lg hover:shadow-brand-from/10"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                    {GAME_LABELS[m.game]}
                  </span>
                  <span className="text-xs text-muted" suppressHydrationWarning>
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
          ))}
        </ul>
      )}
    </>
  );
}
