"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { authCardClass, fieldClass, primaryButtonClass } from "@/components/auth-shell";
import { cn } from "@/lib/cn";
import { authenticate, type AuthState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(authenticate, {});

  return (
    <div className={authCardClass}>
      <div className="mb-5 grid grid-cols-2 border-b border-line text-sm" role="tablist">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "-mb-px border-b-2 py-2.5 font-semibold transition-colors",
              mode === m ? "border-brand-from text-fg" : "border-transparent text-muted hover:text-fg",
            )}
          >
            {m === "signin" ? "Sign In" : "Create Account"}
          </button>
        ))}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="intent" value={mode} />
        <input type="hidden" name="next" value={next} />

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            spellCheck={false}
            className={fieldClass}
          />
        </label>

        <label className="block">
          <span className="mb-1 flex items-center justify-between text-xs font-medium text-muted">
            Password
            {mode === "signin" && (
              <Link href="/forgot-password" className="font-normal text-brand underline-offset-4 hover:underline">
                Forgot password?
              </Link>
            )}
          </span>
          <input
            name="password"
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className={fieldClass}
          />
        </label>

        {state.error && <p className="text-sm text-avoid" role="alert">{state.error}</p>}
        {state.message && <p className="text-sm text-success" role="status">{state.message}</p>}

        <button
          type="submit"
          disabled={pending}
          className={primaryButtonClass}
        >
          {pending ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
