"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { STOCK_ICONS } from "@/lib/stock-icons";
import type { Game } from "@/lib/types";

const SIZES = { sm: "size-6", md: "size-7", lg: "size-9 sm:size-11" } as const;

/** Whether this character has an imported stock icon. */
export function hasCharacterIcon(game: Game, name: string) {
  return Boolean(STOCK_ICONS[game]?.[name]);
}

/**
 * Character stock icon (imported by scripts/import-stock-icons.mjs). Renders nothing when the character
 * has no icon, or if the file fails to load, so labels fall back to the name alone.
 */
export function CharacterIcon({
  game,
  name,
  size = "md",
  className,
}: {
  game: Game;
  name: string;
  /** sm 24 px (search list), md 28 px (cards), lg 36/44 px (matchup title). */
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = STOCK_ICONS[game]?.[name];
  if (!src || failed) return null;
  return (
    // Plain <img>: tiny pre-sized WebP files (64 px), no need for Next's image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={64}
      height={64}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("shrink-0 object-contain", SIZES[size], className)}
    />
  );
}
