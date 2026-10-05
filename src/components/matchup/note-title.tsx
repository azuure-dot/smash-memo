"use client";

import { Check, Pencil, X } from "lucide-react";
import { useState, useTransition } from "react";
import { renameNote } from "@/app/(app)/actions";
import { cn } from "@/lib/cn";
import { NOTE_TITLE_MAX } from "@/lib/note-title";
import { NoteLabel } from "../matchup-label";

/** A simple note's title (the page's h1, on its post-it) with a pencil to rename it. */
export function NoteTitle({ id, initialTitle }: { id: string; initialTitle: string }) {
  const [title, setTitle] = useState(initialTitle);
  const [draft, setDraft] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (draft.trim() === title) return setEditing(false);
    setError(null);
    startTransition(async () => {
      const res = await renameNote(id, draft);
      if (res.error || !res.title) return setError(res.error ?? "Couldn't rename the note.");
      setTitle(res.title);
      setEditing(false);
    });
  }

  function cancel() {
    setDraft(title);
    setError(null);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="mt-5 flex items-start gap-1">
        <NoteLabel as="h1" variant="title" id={id} title={title} />
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-1 grid size-9 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          aria-label="Rename note"
          title="Rename"
        >
          <Pencil className="size-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="mt-5">
      <h1 className="sr-only">{title}</h1>
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Escape" && cancel()}
          maxLength={NOTE_TITLE_MAX}
          autoFocus
          autoComplete="off"
          aria-label="Note title"
          aria-invalid={Boolean(error)}
          className="min-w-0 flex-1 border-0 border-b border-line bg-transparent px-1 py-1.5 font-serif text-2xl font-semibold outline-none transition-colors focus:border-fg/60 sm:text-3xl"
        />
        <button
          type="submit"
          disabled={pending || !draft.trim()}
          className="grid size-10 shrink-0 place-items-center rounded-md bg-brand text-on-brand transition-[filter,opacity] hover:brightness-110 disabled:opacity-50"
          aria-label="Save title"
          title="Save"
        >
          <Check className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={cancel}
          className="grid size-10 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          aria-label="Cancel renaming"
          title="Cancel"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <p className={cn("mt-1 text-xs", error ? "text-avoid" : "text-muted")} role={error ? "alert" : undefined}>
        {error ?? `${NOTE_TITLE_MAX - draft.length} characters left`}
      </p>
    </form>
  );
}
