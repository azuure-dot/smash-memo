"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Chromium-only event, not in TypeScript's DOM types. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallPlatform = "android" | "ios";

const DISMISS_KEY = "sm-install-dismissed-at";
const DISMISS_DAYS = 30;
const SHOW_DELAY_MS = 3000; // let people see the page before asking
const MOBILE_QUERY = "(max-width: 768px)";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's own flag for home-screen apps
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * True only for Safari on iPhone / iPad: the one iOS browser whose Share menu has "Add to Home Screen".
 * iPadOS 13+ reports a Mac user agent, so it's recognised by "Macintosh" + a touch screen.
 */
function isIOSSafari() {
  const ua = navigator.userAgent;
  const iOS = /iPhone|iPod|iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (!iOS) return false;
  // Other browsers and in-app web views on iOS all contain "Safari" too: exclude them by their markers.
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|YaBrowser|DuckDuckGo|FBAN|FBAV|Instagram|Line\/|Twitter|Discord|Snapchat/i;
  return /Safari/.test(ua) && !otherBrowser.test(ua);
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false; // storage blocked (private mode): just show it
  }
}

function rememberDismissal() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // storage blocked: it will simply show again next visit
  }
}

/**
 * Decides whether to offer installing the app, and how:
 * - "android": the browser fired `beforeinstallprompt`, so `install()` opens the native prompt.
 * - "ios": Safari on iPhone/iPad, which needs manual "Share → Add to Home Screen" instructions.
 * - null: nothing to show (desktop, already installed, dismissed < 30 days ago, unsupported browser).
 */
export function usePWAInstall() {
  const [platform, setPlatform] = useState<InstallPlatform | null>(null);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (!window.matchMedia(MOBILE_QUERY).matches || isStandalone() || recentlyDismissed()) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const showLater = (p: InstallPlatform) => {
      clearTimeout(timer);
      timer = setTimeout(() => setPlatform(p), SHOW_DELAY_MS);
    };

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // replace Chrome's mini-infobar with our own popup
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      showLater("android");
    };
    const onInstalled = () => {
      clearTimeout(timer);
      deferredPrompt.current = null;
      setPlatform(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    if (isIOSSafari()) showLater("ios");

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    rememberDismissal();
    setPlatform(null);
  }, []);

  /** Android only: opens the browser's install dialog. Declining it counts as "Not now". */
  const install = useCallback(async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) return;
    deferredPrompt.current = null; // a prompt event can only be used once
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPlatform(null);
    else dismiss();
  }, [dismiss]);

  return { platform, install, dismiss };
}
