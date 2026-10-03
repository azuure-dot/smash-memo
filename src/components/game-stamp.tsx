import { cn } from "@/lib/cn";
import { GAME_LABELS } from "@/lib/game-data";
import type { Game } from "@/lib/types";

/** Game name as a small rubber stamp in magenta ink, slightly askew. */
export function GameStamp({ game, className }: { game: Game; className?: string }) {
  return (
    <span
      translate="no"
      className={cn(
        "inline-block -rotate-2 rounded-[3px] border-[1.5px] border-brand-from/70 px-1.5 py-px font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-brand opacity-90",
        className,
      )}
    >
      {GAME_LABELS[game]}
    </span>
  );
}
