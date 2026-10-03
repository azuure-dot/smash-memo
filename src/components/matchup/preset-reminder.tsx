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
  error: "Couldn't save — retrying on next edit",
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

  return (
    <section
      aria-labelledby="reminder-title"
      className="rounded-2xl border border-brand-to/40 bg-brand-to/[0.06] p-4 shadow-[0_0_32px_-16px] shadow-brand-to sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-white">
            <Zap className="size-4" />
          </span>
          <div>
            <h2 id="reminder-title" className="font-semibold leading-tight">Pre-Set Reminder</h2>
            <p className="text-xs text-muted">Read this right before the set.</p>
          </div>
        </div>
        {!readOnly && (
          <span className={cn("text-xs", saveState === "error" ? "text-red-400" : "text-muted")} aria-live="polite">
            {SAVE_LABEL[saveState]}
          </span>
        )}
      </div>

      {readOnly ? (
        <blockquote className="whitespace-pre-wrap break-words border-l-2 border-brand-to pl-4 text-[15px] leading-relaxed">
          {text}
        </blockquote>
      ) : (
        <textarea
          value={text}
          onChange={(e) => change(e.target.value)}
          onBlur={() => void flush()}
          maxLength={MAX_LENGTH}
          rows={3}
          aria-labelledby="reminder-title"
          placeholder={"e.g. Watch out for neutral B, DI out on down-throw…"}
          className="field-sizing-content min-h-24 w-full resize-none rounded-xl border border-brand-to/25 bg-bg/60 px-3.5 py-3 text-[15px] leading-relaxed outline-none transition placeholder:text-muted/60 focus:border-brand-to/70"
        />
      )}
    </section>
  );
}
