"use client";

import { Trash2 } from "lucide-react";
import { deleteMatchup } from "@/app/(app)/actions";
import type { NoteKind } from "@/lib/types";

export function DeleteMatchupButton({ id, kind = "matchup" }: { id: string; kind?: NoteKind }) {
  const what = kind === "note" ? "note" : "matchup";
  return (
    <form
      action={deleteMatchup.bind(null, id)}
      onSubmit={(e) => {
        const message =
          kind === "note"
            ? "Delete this note? This can't be undone."
            : "Delete this matchup and all its notes? This can't be undone.";
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="grid size-9 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-avoid/10 hover:text-avoid"
        aria-label={`Delete ${what}`}
        title={`Delete ${what}`}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </form>
  );
}
