"use client";

import { useActionState, useState } from "react";
import { cn } from "@/lib/cn";
import { authenticate, type AuthState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(authenticate, {});

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1 text-sm" role="tablist">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-lg py-2 font-medium transition",
              mode === m ? "bg-bg text-fg shadow" : "text-muted hover:text-fg",
            )}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="intent" value={mode} />
        <input type="hidden" name="next" value={next} />

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none transition focus:border-brand-from"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none transition focus:border-brand-from"
          />
        </label>

        {state.error && <p className="text-sm text-red-400" role="alert">{state.error}</p>}
        {state.message && <p className="text-sm text-emerald-300" role="status">{state.message}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
