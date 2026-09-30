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
        className="grid size-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-red-500/10 hover:text-red-400"
        aria-label="Delete matchup"
        title="Delete matchup"
      >
        <Trash2 className="size-4" />
      </button>
    </form>
  );
}
