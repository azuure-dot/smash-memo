"use client";

import { Download, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { usePWAInstall } from "@/lib/use-pwa-install";

const CLOSE_ANIMATION_MS = 250;

/** iOS "Share" glyph (square with an up arrow), drawn inline so it matches Safari's toolbar. */
function IOSShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-label="Share">
      <path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" />
      <path d="M12 15V3" />
      <path d="m8 7 4-4 4 4" />
    </svg>
  );
}

/** Mobile-only bottom sheet offering to install the app (native prompt on Android, instructions on iOS). */
export function InstallPrompt() {
  const { platform, install, dismiss } = usePWAInstall();
  const [closing, setClosing] = useState(false);

  if (!platform) return null;

  // Play the slide-down animation, then actually hide.
  const close = (action: () => void) => {
    setClosing(true);
    setTimeout(() => {
      action();
      setClosing(false);
    }, CLOSE_ANIMATION_MS);
  };

  return (
    <div
      role="dialog"
      aria-labelledby="install-title"
      className={cn(
        "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 md:hidden",
        "rounded-2xl border border-line bg-surface/95 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl",
        closing ? "animate-slide-down" : "animate-slide-up",
        "motion-reduce:animate-none",
      )}
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" className="size-11 shrink-0 rounded-xl" />

        <div className="min-w-0 flex-1">
          <p id="install-title" className="font-semibold">Install Smash Memo</p>
          {platform === "android" ? (
            <p className="mt-0.5 text-sm text-muted">Open your notes from the home screen, full screen, in one tap.</p>
          ) : (
            <p className="mt-0.5 text-sm leading-relaxed text-muted">
              To install this app, tap the Share icon{" "}
              <IOSShareIcon className="inline size-[1.1em] -translate-y-px align-middle text-brand-from" /> below and
              select <span className="font-medium text-fg">&lsquo;Add to Home Screen&rsquo;</span>.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => close(dismiss)}
          className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-fg"
          aria-label="Not now"
          title="Not now"
        >
          <X className="size-4" />
        </button>
      </div>

      {platform === "android" && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => close(dismiss)}
            className="h-10 flex-1 rounded-xl border border-line text-sm font-medium text-muted transition hover:text-fg"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={() => void install()}
            className="flex h-10 flex-[2] items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-on-brand transition hover:brightness-110"
          >
            <Download className="size-4" /> Install App
          </button>
        </div>
      )}
    </div>
  );
}
