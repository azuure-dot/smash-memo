"use client";

import { BookmarkCheck, BookmarkPlus, CopyPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { duplicateSharedMatchup, setSaved } from "@/app/share/actions";
import { cn } from "@/lib/cn";

/** "Save to my workspace" + "Duplicate to my notes", shown to signed-in visitors of a shared note. */
export function SharedNoteActions({ id, initialSaved }: { id: string; initialSaved: boolean }) {
  const [saved, setSavedState] = useState(initialSaved);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const [duplicating, startDuplicate] = useTransition();

  function toggleSaved() {
    setError(null);
    const next = !saved;
    setSavedState(next);
    startSave(async () => {
      const res = await setSaved(id, next);
      if (res.error) {
        setSavedState(!next);
        setError(res.error);
      }
    });
  }

  function duplicate() {
    setError(null);
    startDuplicate(async () => {
      // On success the action redirects to the new, editable copy.
      const res = await duplicateSharedMatchup(id);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleSaved}
          disabled={saving}
          aria-pressed={saved}
          className={cn(
            "flex h-10 items-center gap-2 rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-60",
            saved
              ? "border border-brand-from/50 bg-[var(--color-magenta-hl)] text-fg hover:border-brand-from"
              : "border border-line bg-surface text-fg hover:border-fg/40",
          )}
        >
          {saved ? <BookmarkCheck className="size-4 text-brand" aria-hidden /> : <BookmarkPlus className="size-4" aria-hidden />}
          {saved ? "Saved to Your Workspace" : "Save to My Workspace"}
        </button>
        <button
          type="button"
          onClick={duplicate}
          disabled={duplicating}
          className="flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-semibold text-on-brand transition-[filter,transform,opacity] hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          <CopyPlus className="size-4" aria-hidden />
          {duplicating ? "Duplicating…" : "Duplicate to My Notes"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-avoid" role="alert">{error}</p>}
    </div>
  );
}
