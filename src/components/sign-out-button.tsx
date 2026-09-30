"use client";

import { LogOut } from "lucide-react";

/** Clears the service-worker page cache (so the next user of this device can't see cached notes), then signs out. */
export function SignOutButton() {
  return (
    <form
      action="/auth/signout"
      method="post"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        void (async () => {
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
          form.submit();
        })();
      }}
    >
      <button
        type="submit"
        className="grid size-9 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="size-4" />
      </button>
    </form>
  );
}
