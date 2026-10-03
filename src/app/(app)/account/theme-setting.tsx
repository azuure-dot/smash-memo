"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { readThemeChoice, setThemeChoice, subscribeThemeChoice, type ThemeChoice } from "@/lib/theme";

const OPTIONS: { value: ThemeChoice; label: string; hint: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", hint: "Follows your device", icon: Monitor },
  { value: "light", label: "Light", hint: "Cream paper", icon: Sun },
  { value: "dark", label: "Dark", hint: "Slate notebook", icon: Moon },
];

/** Tiny sheet-on-desk preview of each theme (the system one is split diagonally). */
function Swatch({ value }: { value: ThemeChoice }) {
  const light = "bg-[#e8e1d3] [--sheet:#fbf8f1] [--ink:#1e2433]";
  const dark = "bg-[#121316] [--sheet:#1b1d21] [--ink:#e9e4d8]";
  const sheet = (
    <span className="absolute inset-x-2 bottom-0 top-2 rounded-t-[3px] bg-[var(--sheet)] p-1.5">
      <span className="block h-[3px] w-3/4 rounded-full bg-[var(--ink)] opacity-70" />
      <span className="mt-1 block h-[3px] w-1/2 rounded-full bg-[var(--ink)] opacity-40" />
      <span className="mt-1 block h-[3px] w-2/3 rounded-full bg-[#b3246f] opacity-70" />
    </span>
  );
  if (value !== "system")
    return (
      <span aria-hidden className={cn("relative block h-12 overflow-hidden rounded-md", value === "light" ? light : dark)}>
        {sheet}
      </span>
    );
  return (
    <span aria-hidden className="relative block h-12 overflow-hidden rounded-md">
      <span className={cn("absolute inset-0", light)}>{sheet}</span>
      <span className={cn("absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)]", dark)}>{sheet}</span>
    </span>
  );
}

export function ThemeSetting() {
  // Read from localStorage on the client only; null while server-rendering (nothing checked yet).
  const choice = useSyncExternalStore<ThemeChoice | null>(subscribeThemeChoice, readThemeChoice, () => null);

  return (
    <fieldset>
      <legend className="sr-only">Theme</legend>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {OPTIONS.map(({ value, label, hint, icon: Icon }) => {
          const selected = choice === value;
          return (
            <label
              key={value}
              className={cn(
                "relative cursor-pointer rounded-lg border p-2 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-[1.5px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-fg/55",
                selected ? "border-fg/70 bg-surface-2" : "border-line hover:border-fg/40",
              )}
            >
              <input
                type="radio"
                name="theme"
                value={value}
                checked={selected}
                onChange={() => setThemeChoice(value)}
                className="sr-only"
              />
              <Swatch value={value} />
              <span className="mt-2 flex items-center gap-1.5 text-sm font-medium">
                <Icon className="size-3.5 text-muted" aria-hidden />
                {label}
                {selected && <Check className="ml-auto size-3.5 text-brand" aria-hidden />}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted">{hint}</span>
            </label>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">Saved on this device.</p>
    </fieldset>
  );
}
