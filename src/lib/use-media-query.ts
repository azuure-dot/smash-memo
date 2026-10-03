"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Live result of a CSS media query. Returns null on the server and during hydration (the screen size
 * isn't known yet): callers should let CSS handle that first paint, so nothing flashes.
 */
export function useMediaQuery(query: string): boolean | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore<boolean | null>(
    subscribe,
    () => window.matchMedia(query).matches,
    () => null,
  );
}
