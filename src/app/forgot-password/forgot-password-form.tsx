"use client";

import Link from "next/link";
import { useActionState } from "react";
import { fieldClass, primaryButtonClass } from "@/components/auth-shell";
import { requestPasswordReset, type ResetState } from "./actions";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(requestPasswordReset, {});

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      {state.message ? (
        <p className="text-sm text-emerald-300" role="status">{state.message}</p>
      ) : (
        <form action={formAction} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Email</span>
            <input name="email" type="email" required autoComplete="email" className={fieldClass} />
          </label>
          {state.error && <p className="text-sm text-red-400" role="alert">{state.error}</p>}
          <button type="submit" disabled={pending} className={primaryButtonClass}>
            {pending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      <p className="mt-4 text-center text-sm text-muted">
        <Link href="/login" className="hover:text-fg">
          ← Back to sign in
        </Link>
      </p>
    </div>
  );
}
