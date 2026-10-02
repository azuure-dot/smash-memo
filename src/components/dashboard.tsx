"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { DEFAULT_GAME, GAMES, isGame } from "@/lib/game-data";
import type { Game, SavedMatchup } from "@/lib/types";
import { GameSelector } from "./game-selector";
import { MatchupList, type MatchupSummary, type Tab } from "./matchup-list";
import { NewMatchupForm } from "./new-matchup-form";

/**
 * Dashboard body. The active game ("global game context") and tab live in the URL
 * (?game=melee&tab=saved), so they survive a refresh and coming back from a note.
 * Every note is already loaded: switching game or tab only filters in the browser.
 */
export function Dashboard({ matchups, saved }: { matchups: MatchupSummary[]; saved: SavedMatchup[] }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const gameParam = params.get("game");
  const game: Game = isGame(gameParam) ? gameParam : DEFAULT_GAME;
  const tab: Tab = params.get("tab") === "saved" ? "saved" : "mine";

  // replaceState keeps Next's useSearchParams in sync without a server round trip.
  function update(next: { game?: Game; tab?: Tab }) {
    const g = next.game ?? game;
    const t = next.tab ?? tab;
    const qs = new URLSearchParams();
    if (g !== DEFAULT_GAME) qs.set("game", g);
    if (t === "saved") qs.set("tab", "saved");
    const query = qs.toString();
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  const counts = Object.fromEntries(GAMES.map((g) => [g, matchups.filter((m) => m.game === g).length])) as Record<
    Game,
    number
  >;

  return (
    <>
      <GameSelector game={game} counts={counts} onChange={(g) => update({ game: g })} />

      <NewMatchupForm game={game} defaultOpen={matchups.length === 0 && saved.length === 0} />

      <MatchupList
        game={game}
        tab={tab}
        onTabChange={(t) => update({ tab: t })}
        matchups={matchups.filter((m) => m.game === game)}
        saved={saved.filter((m) => m.game === game)}
      />
    </>
  );
}
