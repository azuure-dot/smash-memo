/**
 * Light / dark theme. The choice ("system" by default) is stored on this device and applied as
 * <html data-theme="light|dark">, which globals.css and Tailwind's dark: variant read.
 */
export type ThemeChoice = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "sm-theme";

/** Desk colour of each theme, for the browser / OS chrome (<meta name="theme-color">). */
export const THEME_COLORS = { light: "#e8e1d3", dark: "#121316" } as const;

/**
 * Runs inline in <head> before first paint (no flash of the wrong theme), then keeps following the
 * device setting while the choice is "system". Kept dependency-free and self-contained on purpose.
 */
export const THEME_INIT_SCRIPT = `(() => {
  const key = ${JSON.stringify(THEME_STORAGE_KEY)}, colors = ${JSON.stringify(THEME_COLORS)};
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const apply = () => {
    let choice = "system";
    try { choice = localStorage.getItem(key) || "system"; } catch {}
    const theme = choice === "light" || choice === "dark" ? choice : mq.matches ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", colors[theme]));
  };
  apply();
  mq.addEventListener("change", apply);
  window.__applyTheme = apply;
})();`;

declare global {
  interface Window {
    __applyTheme?: () => void;
  }
}

export function readThemeChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function setThemeChoice(choice: ThemeChoice) {
  try {
    if (choice === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Storage blocked (private mode): the theme still applies for this page.
  }
  window.__applyTheme?.();
  if (choice !== "system") document.documentElement.dataset.theme = choice;
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

/** Fired on this tab when the choice changes (other tabs get the native "storage" event). */
export const THEME_CHANGE_EVENT = "sm-theme-change";

export function subscribeThemeChoice(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
