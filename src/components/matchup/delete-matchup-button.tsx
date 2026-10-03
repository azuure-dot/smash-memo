"use client";

import { Trash2 } from "lucide-react";
import { deleteMatchup } from "@/app/(app)/actions";

export function DeleteMatchupButton({ id }: { id: string }) {
  return (
    <form
      action={deleteMatchup.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("Delete this matchup and all its notes? This can't be undone.")) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="grid size-9 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-avoid/10 hover:text-avoid"
        aria-label="Delete matchup"
        title="Delete matchup"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </form>
  );
}
