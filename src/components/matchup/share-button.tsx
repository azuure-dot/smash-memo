"use client";

import { Check, Copy, Link2, Share2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { setSharing } from "@/app/share/actions";
import { cn } from "@/lib/cn";

/** Owner-only control: turns the note's share link on/off and copies it. */
export function ShareButton({ id, initialShared }: { id: string; initialShared: boolean }) {
  const [shared, setShared] = useState(initialShared);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);

  // Only read after a click (the panel never renders on the server), so window is available.
  const shareUrl = () => `${window.location.origin}/share/${id}`;

  // Close the panel on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. some in-app browsers): let the user copy the selected link by hand.
      linkRef.current?.select();
    }
  }

  function toggle(next: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await setSharing(id, next);
      if (res.error) return setError(res.error);
      setShared(next);
      if (next) await copy();
      else setOpen(false);
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => (shared ? setOpen((o) => !o) : (setOpen(true), toggle(true)))}
        disabled={pending}
        aria-expanded={open}
        className={cn(
          "flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors disabled:opacity-60",
          shared
            ? "border border-brand-from/50 bg-[var(--color-magenta-hl)] text-fg hover:border-brand-from"
            : "border border-line bg-surface text-fg hover:border-brand-from/60 hover:text-brand",
        )}
      >
        {shared ? <Link2 className="size-4 text-brand" aria-hidden /> : <Share2 className="size-4" aria-hidden />}
        {shared ? "Shared" : "Share"}
      </button>

      {open && (
        <div className="paper absolute right-0 top-11 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-md p-4">
          {shared ? (
            <>
              <p className="font-serif text-[15px] font-semibold">Anyone With the Link Can View</p>
              <p className="mt-1 text-xs text-muted">
                They can read this note, save it or duplicate it. Only you can edit it.
              </p>
              <div className="mt-3 flex gap-2">
                <input
                  ref={linkRef}
                  readOnly
                  value={shareUrl()}
                  onFocus={(e) => e.target.select()}
                  aria-label="Share link"
                  className="min-w-0 flex-1 rounded-md border border-line bg-surface-2 px-3 py-2 text-xs text-muted"
                />
                <button
                  type="button"
                  onClick={copy}
                  className="flex shrink-0 items-center gap-1.5 rounded-md bg-brand px-3 text-xs font-semibold text-on-brand transition-[filter] hover:brightness-110"
                >
                  {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => toggle(false)}
                disabled={pending}
                className="mt-3 text-xs text-muted underline decoration-dashed underline-offset-4 transition-colors hover:text-avoid disabled:opacity-60"
              >
                Stop sharing
              </button>
            </>
          ) : (
            <p className="text-sm text-muted">{pending ? "Creating link…" : "This note is private."}</p>
          )}
          {error && <p className="mt-2 text-xs text-avoid" role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}
