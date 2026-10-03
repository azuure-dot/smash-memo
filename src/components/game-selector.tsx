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
              "group relative flex h-24 flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 transition sm:h-28",
              active
                ? "border-brand-from/70 bg-brand-from/10"
                : "border-line bg-surface hover:border-brand-from/50",
            )}
          >
            <Image
              src={logo.src}
              alt={GAME_LABELS[g]}
              width={logo.width}
              height={logo.height}
              priority
              className={cn(
                "w-auto max-w-full object-contain transition",
                // The Rivals logo is squarer than the Smash ones: a bit taller so it reads at the same size.
                g === "roa2" ? "h-12 sm:h-[3.75rem]" : "h-9 sm:h-12",
                active ? "opacity-100" : "opacity-65 grayscale-[35%] group-hover:opacity-100 group-hover:grayscale-0",
              )}
            />
            <span className={cn("text-[11px] font-medium", active ? "text-fg" : "text-muted")}>
              {counts[g]} {counts[g] === 1 ? "note" : "notes"}
            </span>
            {active && <span aria-hidden className="absolute inset-x-6 -bottom-px h-0.5 rounded-full bg-brand" />}
          </button>
        );
      })}
    </div>
  );
}
