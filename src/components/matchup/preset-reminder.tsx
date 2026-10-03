"use client";

import { Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";

const MAX_LENGTH = 5000;

type SaveState = "idle" | "dirty" | "saving" | "saved" | "error";

const SAVE_LABEL: Record<SaveState, string> = {
  idle: "",
  dirty: "Unsaved changes",
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save. Retrying on your next edit.",
};

/**
 * Short plain-text TL;DR read right before a set starts. Autosaves like the notes editor.
 * Read-only (shared notes): shown as a quote block, or hidden if empty.
 */
export function PresetReminder({
  matchupId,
  initialText,
  readOnly = false,
}: {
  matchupId: string;
  initialText: string | null;
  readOnly?: boolean;
}) {
  const supabase = createClient();
  const [text, setText] = useState(initialText ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<string | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const value = pending.current;
    if (value === null) return;
    pending.current = null;
    setSaveState("saving");
    const { error } = await supabase
      .from("matchups")
      .update({ preset_reminder: value.trim() ? value : null })
      .eq("id", matchupId);
    if (error) {
      pending.current ??= value; // keep it for the next attempt
      setSaveState("error");
    } else {
      setSaveState(pending.current !== null ? "dirty" : "saved");
    }
  }, [matchupId, supabase]);

  // Save right away when the app is backgrounded (installed PWA on mobile) or the page is left.
  useEffect(() => {
    if (readOnly) return;
    const onHide = () => document.visibilityState === "hidden" && void flush();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      void flush();
    };
  }, [flush, readOnly]);

  if (readOnly && !text.trim()) return null;

  function change(value: string) {
    setText(value);
    pending.current = value;
    setSaveState("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 800);
  }

  // Ruled notebook paper: text sits on the lines (line-height = rule spacing), left of the red margin is empty.
  const ruled = "bg-ruled pb-3 pl-12 pr-4 pt-1.5 font-serif text-[16px] leading-[1.75rem] sm:pr-6";

  return (
    <section aria-labelledby="reminder-title" className="paper overflow-hidden rounded-lg">
      <div className="flex items-end justify-between gap-3 px-4 pb-1 pt-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Zap className="size-4 -rotate-6 text-brand" aria-hidden />
          <h2 id="reminder-title" className="font-hand text-[26px] font-bold leading-none text-brand">
            Pre-set reminder
          </h2>
          <span className="hidden text-xs text-muted sm:inline">Read this right before the set.</span>
        </div>
        {!readOnly && (
          <span className={cn("text-xs", saveState === "error" ? "text-avoid" : "text-muted")} aria-live="polite">
            {SAVE_LABEL[saveState]}
          </span>
        )}
      </div>

      {readOnly ? (
        <p className={cn(ruled, "min-h-[5.5rem] whitespace-pre-wrap break-words")}>{text}</p>
      ) : (
        <textarea
          name="preset_reminder"
          value={text}
          onChange={(e) => change(e.target.value)}
          onBlur={() => void flush()}
          maxLength={MAX_LENGTH}
          rows={4}
          autoComplete="off"
          aria-labelledby="reminder-title"
          placeholder="e.g. Watch out for neutral B, DI out on down-throw…"
          className={cn(
            ruled,
            "block field-sizing-content min-h-[7.5rem] w-full resize-none border-0 bg-transparent placeholder:text-muted/60",
          )}
        />
      )}
    </section>
  );
}
