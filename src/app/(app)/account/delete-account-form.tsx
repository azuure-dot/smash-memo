"use client";

import { AlertTriangle } from "lucide-react";
import { useActionState, useState } from "react";
import { deleteAccount, type DeleteAccountState } from "./actions";

export function DeleteAccountForm({ matchupCount }: { matchupCount: number }) {
  const [typed, setTyped] = useState("");
  const [state, formAction, pending] = useActionState<DeleteAccountState, FormData>(
    async (prev, formData) => {
      // Remove offline copies of pages from this device before the account disappears.
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      return deleteAccount(prev, formData);
    },
    {},
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex gap-3 rounded-xl border border-avoid/30 bg-avoid/5 p-3 text-sm text-fg">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-avoid" aria-hidden />
        <p>
          This permanently deletes your account and{" "}
          <strong>
            {matchupCount} {matchupCount === 1 ? "matchup" : "matchups"}
          </strong>{" "}
          with all their stages, reminders, notes and videos. It can&apos;t be undone.
        </p>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">
          Type <span className="font-mono text-fg">DELETE</span> to confirm
        </span>
        <input
          name="confirm"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 font-mono text-sm outline-none transition focus:border-fg/60"
        />
      </label>

      {state.error && <p className="text-sm text-avoid" role="alert">{state.error}</p>}

      <button
        type="submit"
        disabled={typed !== "DELETE" || pending}
        className="w-full rounded-xl bg-avoid py-2.5 text-sm font-semibold text-on-brand transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? "Deleting…" : "Delete my account"}
      </button>
    </form>
  );
}
