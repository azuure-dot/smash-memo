"use client";

import { ArrowLeftRight, X } from "lucide-react";
import { useActionState, useState } from "react";
import { createMatchup, type CreateMatchupState } from "@/app/(app)/actions";
import { CHARACTER_EXAMPLES, GAME_LABELS } from "@/lib/game-data";
import type { Game } from "@/lib/types";
import { CharacterCombobox } from "./character-combobox";

/**
 * The game comes from the dashboard's global game selector: the form only asks for the two characters.
 * Opened and closed by the dashboard (which also offers "New … Note").
 */
export function NewMatchupForm({ game, onClose }: { game: Game; onClose: () => void }) {
  const [mine, setMine] = useState("");
  const [opp, setOpp] = useState("");
  const [state, formAction, pending] = useActionState<CreateMatchupState, FormData>(createMatchup, {});

  return (
    <form action={formAction} className="paper rounded-lg p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold">
          New <span className="text-brand">{GAME_LABELS[game]}</span> matchup
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

      <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <CharacterCombobox
          game={game}
          name="my_character"
          label="My character"
          value={mine}
          onChange={setMine}
          placeholder={`e.g. ${CHARACTER_EXAMPLES[game][0]}…`}
        />

        <button
          type="button"
          onClick={() => {
            setMine(opp);
            setOpp(mine);
          }}
          className="mx-auto grid size-10 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-brand"
          aria-label="Swap characters"
          title="Swap"
        >
          <ArrowLeftRight className="size-4" aria-hidden />
        </button>

        <CharacterCombobox
          game={game}
          name="opponent_character"
          label="Opponent"
          value={opp}
          onChange={setOpp}
          placeholder={`e.g. ${CHARACTER_EXAMPLES[game][1]}…`}
        />
      </div>

      {state.error && (
        <p className="mt-3 text-sm text-avoid" role="alert">
          {state.error}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate font-serif text-base text-muted">
          {mine || "…"} <span className="mx-1 font-hand text-xl font-bold text-brand">vs</span> {opp || "…"}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition-[filter,transform,opacity] hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create Note"}
        </button>
      </div>
    </form>
  );
}
