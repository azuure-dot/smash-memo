"use client";

import { Search, X } from "lucide-react";
import { useRef } from "react";

/** Dashboard search: a line to write on (no box, no focus frame), with a clear button and Escape to clear. */
export function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div role="search" className="flex items-center gap-2 border-b border-line transition-colors focus-within:border-fg/60">
      <Search className="size-4 shrink-0 text-muted" aria-hidden />
      <input
        ref={input}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            onChange("");
          }
        }}
        placeholder="Search by title or character…"
        aria-label="Search your notes"
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        // Hides the browser's own clear cross (we draw ours, consistent everywhere).
        className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2.5 font-serif text-base outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            input.current?.focus();
          }}
          className="grid size-8 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          aria-label="Clear search"
          title="Clear search"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
