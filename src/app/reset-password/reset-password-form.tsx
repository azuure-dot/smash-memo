"use client";

import { useActionState } from "react";
import { fieldClass, primaryButtonClass } from "@/components/auth-shell";
import { updatePassword, type ResetState } from "@/app/forgot-password/actions";

export function ResetPasswordForm({
  email,
  returnTo = "/",
  submitLabel = "Save new password",
  bare = false,
}: {
  email: string;
  returnTo?: string;
  submitLabel?: string;
  /** Renders without the card border (for use inside another section). */
  bare?: boolean;
}) {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(updatePassword, {});

  return (
    <form
      action={formAction}
      className={bare ? "space-y-3" : "space-y-3 rounded-2xl border border-line bg-surface p-5"}
    >
      <input type="hidden" name="return_to" value={returnTo} />
      {/* Lets password managers attach the new password to the right account */}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">New password</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Confirm new password</span>
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} />
      </label>
      {state.error && <p className="text-sm text-avoid" role="alert">{state.error}</p>}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
