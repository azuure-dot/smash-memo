import { StickyNote } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Game, NoteKind } from "@/lib/types";
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
    noteIcon: "size-4",
    tape: "-top-2 h-4 w-12",
    tilts: TILTS,
  },
  title: {
    box: "gap-x-3 gap-y-1.5 px-4 py-3 sm:px-5",
    name: "text-2xl sm:text-3xl",
    vs: "text-3xl sm:text-4xl",
    icon: "lg",
    noteIcon: "size-6",
    tape: "-top-2.5 h-5 w-16",
    tilts: TITLE_TILTS,
  },
} as const;

type LabelProps = {
  id: string;
  variant?: keyof typeof VARIANTS;
  /** "h1" on the note page, where the label is the page title. */
  as?: "div" | "h1";
  className?: string;
};

/** The post-it itself: pale pink paper in light mode, dark magenta in dark mode, held by masking tape. */
function PostIt({ id, variant = "card", as: Tag = "div", className, children }: LabelProps & { children: React.ReactNode }) {
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
      {children}
    </Tag>
  );
}

/**
 * A simple note's title on the same post-it, with a small sticky-note mark so it can't be mistaken for a matchup
 * (the Saved Notes tab mixes both). Clamped to two lines on the dashboard cards, in full as the page title.
 */
export function NoteLabel({ title, ...props }: LabelProps & { title: string }) {
  const v = VARIANTS[props.variant ?? "card"];
  return (
    <PostIt {...props}>
      <span className="flex min-w-0 max-w-full items-start gap-2">
        <StickyNote className={cn("mt-[0.3em] shrink-0 text-label-accent", v.noteIcon)} aria-hidden />
        <span
          className={cn(
            "min-w-0 break-words font-serif font-semibold leading-snug",
            v.name,
            props.variant !== "title" && "line-clamp-2",
          )}
        >
          {title}
        </span>
      </span>
    </PostIt>
  );
}

/** The right label for a row of the matchups table: characters for a matchup, title for a simple note. */
export function EntryLabel({
  entry,
  ...props
}: LabelProps & {
  entry: { game: Game; kind?: NoteKind | null; title: string | null; my_character: string | null; opponent_character: string | null };
}) {
  return entry.kind === "note" ? (
    <NoteLabel {...props} title={entry.title ?? "Untitled note"} />
  ) : (
    <MatchupLabel {...props} game={entry.game} mine={entry.my_character ?? "?"} opponent={entry.opponent_character ?? "?"} />
  );
}

/**
 * "[icon] Marth vs [icon] Fox" on a post-it stuck down with masking tape: pale pink paper in light mode,
 * dark magenta in dark mode. Used on the dashboard cards and as the matchup page title.
 */
export function MatchupLabel({
  game,
  mine,
  opponent,
  ...props
}: LabelProps & {
  game: Game;
  mine: string;
  opponent: string;
}) {
  const v = VARIANTS[props.variant ?? "card"];
  return (
    <PostIt {...props}>
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
    </PostIt>
  );
}
