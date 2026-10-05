"use client";

import { Plus, StickyNote } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DEFAULT_GAME, GAME_LABELS, GAMES, isGame } from "@/lib/game-data";
import type { Game, SavedMatchup } from "@/lib/types";
import { GameSelector } from "./game-selector";
import { MatchupList, type MatchupSummary, type Tab } from "./matchup-list";
import { NewMatchupForm } from "./new-matchup-form";
import { NewNoteForm } from "./new-note-form";

const TABS: Tab[] = ["matchups", "notes", "saved"];
const isTab = (v: string | null): v is Tab => TABS.includes(v as Tab);

/**
 * Dashboard body. The active game ("global game context") and tab live in the URL
 * (?game=melee&tab=notes), so they survive a refresh and coming back from a note.
 * Every note is already loaded: switching game or tab only filters in the browser.
 */
export function Dashboard({ matchups, saved }: { matchups: MatchupSummary[]; saved: SavedMatchup[] }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const gameParam = params.get("game");
  const tabParam = params.get("tab");
  const game: Game = isGame(gameParam) ? gameParam : DEFAULT_GAME;
  const tab: Tab = isTab(tabParam) ? tabParam : "matchups";
  // Brand-new account: the matchup form is already open.
  const [creating, setCreating] = useState<"matchup" | "note" | null>(
    matchups.length === 0 && saved.length === 0 ? "matchup" : null,
  );

  // replaceState keeps Next's useSearchParams in sync without a server round trip.
  function update(next: { game?: Game; tab?: Tab }) {
    const g = next.game ?? game;
    const t = next.tab ?? tab;
    const qs = new URLSearchParams();
    if (g !== DEFAULT_GAME) qs.set("game", g);
    if (t !== "matchups") qs.set("tab", t);
    const query = qs.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  const counts = Object.fromEntries(GAMES.map((g) => [g, matchups.filter((m) => m.game === g).length])) as Record<
    Game,
    number
  >;
  const ofGame = matchups.filter((m) => m.game === game);

  return (
    <>
      <GameSelector game={game} counts={counts} onChange={(g) => update({ game: g })} />

      {creating === "matchup" ? (
        <NewMatchupForm game={game} onClose={() => setCreating(null)} />
      ) : creating === "note" ? (
        <NewNoteForm game={game} onClose={() => setCreating(null)} />
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCreating("matchup")}
            className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition-[filter,transform] hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="size-4" aria-hidden /> New {GAME_LABELS[game]} Matchup
          </button>
          <button
            type="button"
            onClick={() => setCreating("note")}
            className="inline-flex items-center gap-2 rounded-md border border-brand-from/60 px-4 py-2.5 text-sm font-semibold text-brand transition-[background-color,transform] hover:bg-[var(--color-magenta-hl)] active:scale-[0.98]"
          >
            <StickyNote className="size-4" aria-hidden /> New {GAME_LABELS[game]} Note
          </button>
        </div>
      )}

      <MatchupList
        game={game}
        tab={tab}
        onTabChange={(t) => update({ tab: t })}
        matchups={ofGame.filter((m) => m.kind !== "note")}
        notes={ofGame.filter((m) => m.kind === "note")}
        saved={saved.filter((m) => m.game === game)}
      />
    </>
  );
}
