"use client";

import { useEffect } from "react";

/** Registers /sw.js in production builds (skipped in dev to avoid stale caches). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((err) => console.error("Service worker registration failed", err));
  }, []);

  return null;
}
