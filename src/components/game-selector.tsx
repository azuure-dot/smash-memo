"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { GAME_LABELS, GAME_LOGOS, GAMES } from "@/lib/game-data";
import type { Game } from "@/lib/types";

/** Primary navigation of the dashboard: picks the game every other control on the page works with. */
export function GameSelector({
  game,
  counts,
  onChange,
}: {
  game: Game;
  /** Number of the user's own notes per game, shown under each logo. */
  counts: Record<Game, number>;
  onChange: (game: Game) => void;
}) {
  return (
    <div role="tablist" aria-label="Game" className="grid grid-cols-3 gap-2 sm:gap-3">
      {GAMES.map((g) => {
        const active = g === game;
        const logo = GAME_LOGOS[g];
        return (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(g)}
            className={cn(
              // Binder index tabs: the active one is a sheet pulled forward, the others sit back on the desk.
              "group relative flex h-24 flex-col items-center justify-center gap-1.5 rounded-lg px-2 transition-[transform,background-color,border-color] duration-200 active:scale-[0.98] sm:h-28",
              active
                ? "paper -translate-y-0.5"
                : "border border-dashed border-line bg-surface/40 hover:border-fg/30 hover:bg-surface/70",
            )}
          >
            <Image
              src={logo.src}
              alt={GAME_LABELS[g]}
              width={logo.width}
              height={logo.height}
              priority
              className={cn(
                "w-auto max-w-full object-contain transition-[opacity,filter]",
                // The Rivals logo is squarer than the Smash ones: a bit taller so it reads at the same size.
                g === "roa2" ? "h-12 sm:h-[3.75rem]" : "h-9 sm:h-12",
                // Ultimate's logo is white: print it in ink on the light paper.
                g === "ultimate" && "invert-[0.88] dark:invert-0",
                active ? "opacity-100" : "opacity-60 grayscale-[40%] group-hover:opacity-90 group-hover:grayscale-0",
              )}
            />
            <span className={cn("text-xs tabular-nums", active ? "font-medium text-fg" : "text-muted")}>
              {counts[g]} {counts[g] === 1 ? "note" : "notes"}
            </span>
            {/* Underlined in magenta ink, like a heading in a notebook. */}
            {active && <span aria-hidden className="absolute inset-x-8 bottom-2 h-[2px] -rotate-1 rounded-full bg-brand" />}
          </button>
        );
      })}
    </div>
  );
}
