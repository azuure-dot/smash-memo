"use client";

import { X } from "lucide-react";
import { useActionState, useState } from "react";
import { createNote, type CreateMatchupState } from "@/app/(app)/actions";
import { cn } from "@/lib/cn";
import { GAME_LABELS } from "@/lib/game-data";
import { NOTE_TITLE_MAX } from "@/lib/note-title";
import type { Game } from "@/lib/types";

/** Simple note for the dashboard's current game: only a title (tech, tournament prep, habits…). */
export function NewNoteForm({ game, onClose }: { game: Game; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [state, formAction, pending] = useActionState<CreateMatchupState, FormData>(createNote, {});
  const left = NOTE_TITLE_MAX - title.length;

  return (
    <form action={formAction} className="paper rounded-lg p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold">
          New <span className="text-brand">{GAME_LABELS[game]}</span> note
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="grid size-9 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          aria-label="Close"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <input type="hidden" name="game" value={game} />

      <label htmlFor="note-title" className="mb-1 block text-xs font-medium text-muted">
        Title
      </label>
      <input
        id="note-title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={NOTE_TITLE_MAX}
        required
        autoFocus
        autoComplete="off"
        placeholder="e.g. Ledge trapping, tournament checklist…"
        aria-describedby="note-title-count"
        // A line to write on, like the rest of the notebook.
        className="w-full border-0 border-b border-line bg-transparent px-1 py-2 font-serif text-base outline-none transition-colors placeholder:text-muted focus:border-fg/60"
      />
      <p
        id="note-title-count"
        className={cn("mt-1 text-right text-xs tabular-nums", left <= 10 ? "text-avoid" : "text-muted")}
        aria-live="polite"
      >
        {left} characters left
      </p>

      {state.error && (
        <p className="mt-2 text-sm text-avoid" role="alert">
          {state.error}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm text-muted">Pre-set reminder, notes and videos, without a stagelist.</p>
        <button
          type="submit"
          disabled={pending || !title.trim()}
          className="shrink-0 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition-[filter,transform,opacity] hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create Note"}
        </button>
      </div>
    </form>
  );
}
