"use client";

import { ArrowLeftRight, Plus, X } from "lucide-react";
import { useActionState, useState } from "react";
import { createMatchup, type CreateMatchupState } from "@/app/(app)/actions";
import { CHARACTER_EXAMPLES, CHARACTERS, GAME_LABELS } from "@/lib/game-data";
import type { Game } from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none transition placeholder:text-muted/60 focus:border-fg/60";

/** The game comes from the dashboard's global game selector: the form only asks for the two characters. */
export function NewMatchupForm({ game, defaultOpen = false }: { game: Game; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [mine, setMine] = useState("");
  const [opp, setOpp] = useState("");
  const [state, formAction, pending] = useActionState<CreateMatchupState, FormData>(createMatchup, {});

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110"
      >
        <Plus className="size-4" /> New {GAME_LABELS[game]} matchup
      </button>
    );
  }

  return (
    <form action={formAction} className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">
          New <span className="text-brand">{GAME_LABELS[game]}</span> matchup
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      <input type="hidden" name="game" value={game} />

      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">My character</span>
          <input
            name="my_character"
            list={`chars-${game}`}
            value={mine}
            onChange={(e) => setMine(e.target.value)}
            placeholder={`e.g. ${CHARACTER_EXAMPLES[game][0]}`}
            required
            autoComplete="off"
            className={inputClass}
          />
        </label>

        <button
          type="button"
          onClick={() => {
            setMine(opp);
            setOpp(mine);
          }}
          className="mx-auto grid size-10 place-items-center rounded-xl border border-line text-muted transition hover:border-brand-from hover:text-fg"
          aria-label="Swap characters"
          title="Swap"
        >
          <ArrowLeftRight className="size-4" />
        </button>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Opponent</span>
          <input
            name="opponent_character"
            list={`chars-${game}`}
            value={opp}
            onChange={(e) => setOpp(e.target.value)}
            placeholder={`e.g. ${CHARACTER_EXAMPLES[game][1]}`}
            required
            autoComplete="off"
            className={inputClass}
          />
        </label>
      </div>

      <datalist id={`chars-${game}`}>
        {CHARACTERS[game].map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {state.error && <p className="mt-3 text-sm text-avoid" role="alert">{state.error}</p>}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="truncate text-sm text-muted">
          {mine || "…"} <span className="text-brand font-semibold">vs</span> {opp || "…"}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create note"}
        </button>
      </div>
    </form>
  );
}
