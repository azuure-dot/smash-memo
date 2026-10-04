import { cn } from "@/lib/cn";
import type { Game } from "@/lib/types";
import { CharacterIcon } from "./character-icon";

/** Small tilts for the labels. Listed in full so Tailwind generates every class. */
const TILTS = ["-rotate-[1.5deg]", "-rotate-1", "-rotate-[0.5deg]", "rotate-[0.5deg]", "rotate-1", "rotate-[1.5deg]"];
const TITLE_TILTS = ["-rotate-1", "-rotate-[0.5deg]", "rotate-[0.5deg]", "rotate-1"];

/** Stable "random" pick from the note id: same angle on every render (server and browser agree). */
function pick<T>(list: T[], id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return list[Math.abs(h) % list.length];
}

const VARIANTS = {
  card: {
    box: "gap-x-2 gap-y-1 px-3 py-2 transition-transform duration-200 group-hover:rotate-0 motion-reduce:transition-none",
    name: "text-[17px]",
    vs: "text-xl",
    icon: "md",
    tape: "-top-2 h-4 w-12",
    tilts: TILTS,
  },
  title: {
    box: "gap-x-3 gap-y-1.5 px-4 py-3 sm:px-5",
    name: "text-2xl sm:text-3xl",
    vs: "text-3xl sm:text-4xl",
    icon: "lg",
    tape: "-top-2.5 h-5 w-16",
    tilts: TITLE_TILTS,
  },
} as const;

/**
 * "[icon] Marth vs [icon] Fox" on a post-it stuck down with masking tape: pale pink paper in light mode,
 * dark magenta in dark mode. Used on the dashboard cards and as the matchup page title.
 */
export function MatchupLabel({
  id,
  game,
  mine,
  opponent,
  variant = "card",
  as: Tag = "div",
  className,
}: {
  id: string;
  game: Game;
  mine: string;
  opponent: string;
  variant?: keyof typeof VARIANTS;
  /** "h1" on the matchup page, where the label is the page title. */
  as?: "div" | "h1";
  className?: string;
}) {
  const v = VARIANTS[variant];
  return (
    <Tag
      className={cn(
        // Wraps onto a second line for long names instead of cutting them.
        "relative flex w-fit max-w-full flex-wrap items-center rounded-[2px] bg-label text-label-ink",
        "shadow-[0_1px_1px_rgb(0_0_0/0.12),0_6px_14px_-8px_rgb(0_0_0/0.45)]",
        v.box,
        pick([...v.tilts], id),
        className,
      )}
    >
      {/* Masking tape holding the post-it. */}
      <span aria-hidden className={cn("absolute left-1/2 -translate-x-1/2 rotate-2 bg-tape shadow-[0_1px_1px_rgb(0_0_0/0.08)]", v.tape)} />
      {/* "Name vs" stay together so a wrap never leaves "vs" alone at the start of a line. */}
      <span className="flex min-w-0 max-w-full items-center gap-1.5">
        <CharacterIcon game={game} name={mine} size={v.icon} />
        <span className={cn("truncate font-serif font-semibold", v.name)}>{mine}</span>
        <span className={cn("ml-0.5 shrink-0 font-hand font-bold leading-none text-label-accent", v.vs)}>vs</span>
      </span>
      <span className="flex min-w-0 max-w-full items-center gap-1.5">
        <CharacterIcon game={game} name={opponent} size={v.icon} />
        <span className={cn("truncate font-serif font-semibold", v.name)}>{opponent}</span>
      </span>
    </Tag>
  );
}
