"use client";

import { useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { CHARACTERS } from "@/lib/game-data";
import type { Game } from "@/lib/types";
import { CharacterIcon, hasCharacterIcon } from "./character-icon";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

/** Roster matches for a query: names starting with it first, then names containing it. */
function search(game: Game, query: string) {
  const q = norm(query);
  const roster = CHARACTERS[game];
  if (!q) return roster;
  const starts = roster.filter((c) => norm(c).startsWith(q));
  const contains = roster.filter((c) => !starts.includes(c) && norm(c).includes(q));
  return [...starts, ...contains];
}

/**
 * Character field with a suggestion list showing each character's stock icon (a native <datalist> can't
 * show images). Accessible combobox: arrows to move, Enter to pick, Escape to close. Free text still allowed.
 */
export function CharacterCombobox({
  game,
  name,
  label,
  value,
  onChange,
  placeholder,
}: {
  game: Game;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => search(game, value), [game, value]);
  // Character exactly typed (any case/accents): show its icon inside the field.
  const exact = CHARACTERS[game].find((c) => norm(c) === norm(value));

  function choose(character: string) {
    onChange(character);
    setOpen(false);
    setActive(-1);
  }

  function move(delta: number) {
    if (!results.length) return;
    setOpen(true);
    const next = (active + delta + results.length) % results.length;
    setActive(next);
    listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
  }

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">
        {label}
      </label>
      <div className="flex items-center gap-2 border-b border-line transition-colors focus-within:border-fg/60">
        {exact && hasCharacterIcon(game, exact) && <CharacterIcon game={game} name={exact} size="sm" />}
        <input
          id={id}
          name={name}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              move(1);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              move(-1);
            } else if (e.key === "Enter" && open && active >= 0) {
              e.preventDefault(); // pick the suggestion instead of submitting the form
              choose(results[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          placeholder={placeholder}
          required
          autoComplete="off"
          spellCheck={false}
          className="w-full min-w-0 border-0 bg-transparent px-1 py-2 font-serif text-base outline-none placeholder:text-muted"
        />
      </div>

      {open && results.length > 0 && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={`${label} suggestions`}
          className="paper absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto overscroll-contain rounded-md py-1"
        >
          {results.map((c, i) => (
            <li
              key={c}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown (not click) so the input doesn't blur and close the list first.
              onMouseDown={(e) => {
                e.preventDefault();
                choose(c);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 px-3 py-1.5 font-serif text-[15px]",
                i === active ? "bg-[var(--color-magenta-hl)] text-fg" : "text-fg",
              )}
            >
              {hasCharacterIcon(game, c) ? (
                <CharacterIcon game={game} name={c} size="sm" />
              ) : (
                <span className="size-6 shrink-0" aria-hidden />
              )}
              <span className="truncate">{c}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
