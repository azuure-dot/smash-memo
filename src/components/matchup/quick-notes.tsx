"use client";

import { ChevronDown, StickyNote, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import type { QuickNote } from "@/lib/types";

const COLUMNS = "id, matchup_id, body, created_at, updated_at";

export function QuickNotes({
  matchupId,
  initialNotes,
  readOnly = false,
}: {
  matchupId: string;
  initialNotes: QuickNote[];
  /** Shared view: notes are listed but can't be added, edited or deleted. */
  readOnly?: boolean;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) draftRef.current?.focus();
  }, [open]);

  async function add() {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    setError(null);
    const { data, error } = await supabase
      .from("quick_notes")
      .insert({ matchup_id: matchupId, body })
      .select(COLUMNS)
      .single();
    setBusy(false);
    if (error || !data) {
      setError("Couldn't add that note.");
      return;
    }
    setNotes((n) => [...n, data as QuickNote]);
    setDraft("");
  }

  async function save(note: QuickNote, value: string) {
    const body = value.trim();
    if (body === note.body) return;
    if (!body) return remove(note);
    setNotes((n) => n.map((x) => (x.id === note.id ? { ...x, body } : x)));
    const { error } = await supabase.from("quick_notes").update({ body }).eq("id", note.id);
    if (error) {
      setNotes((n) => n.map((x) => (x.id === note.id ? note : x)));
      setError("Couldn't save that edit.");
    }
  }

  async function remove(note: QuickNote) {
    const before = notes;
    setNotes((n) => n.filter((x) => x.id !== note.id));
    const { error } = await supabase.from("quick_notes").delete().eq("id", note.id);
    if (error) {
      setNotes(before);
      setError("Couldn't delete that note.");
    }
  }

  return (
    <section
      className={cn(
        "rounded-2xl border bg-surface transition-colors",
        open ? "border-brand-from/50" : "border-line",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="quick-notes-panel"
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-5"
      >
        <span className={cn("grid size-8 place-items-center rounded-lg", open ? "bg-brand text-white" : "bg-surface-2 text-muted")}>
          <StickyNote className="size-4" />
        </span>
        <span className="flex-1">
          <span className="font-semibold">Quick Notes</span>
          {notes.length > 0 && (
            <span className="ml-2 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">{notes.length}</span>
          )}
        </span>
        <span className="flex items-center gap-1 text-sm text-muted">
          {open ? "Hide" : notes.length || readOnly ? "Show" : "Add quick note"}
          <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
        </span>
      </button>

      {open && (
        <div id="quick-notes-panel" className="border-t border-line px-4 pb-4 pt-3 sm:px-5">
          {readOnly ? (
            notes.length > 0 ? (
              <ul className="space-y-1.5">
                {notes.map((note) => (
                  <li key={note.id} className="flex items-start gap-2 rounded-xl bg-surface-2/60 px-3 py-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                    <p className="flex-1 whitespace-pre-wrap break-words text-sm leading-6">{note.body}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No quick notes for this matchup.</p>
            )
          ) : (
          <>
          {notes.length > 0 && (
            <ul className="mb-3 space-y-1.5">
              {notes.map((note) => (
                <li key={note.id} className="group flex items-start gap-2 rounded-xl bg-surface-2/60 px-3 py-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  <textarea
                    defaultValue={note.body}
                    onBlur={(e) => save(note, e.target.value)}
                    rows={1}
                    maxLength={2000}
                    aria-label="Quick note"
                    className="field-sizing-content min-h-6 flex-1 resize-none bg-transparent text-sm leading-6 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => remove(note)}
                    className="grid size-6 shrink-0 place-items-center rounded-md text-muted transition hover:bg-bg hover:text-fg sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                    aria-label="Delete quick note"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void add();
            }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={draftRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void add();
                }
              }}
              rows={1}
              maxLength={2000}
              placeholder="e.g. Shield after dash-back, they love to whiff punish"
              className="field-sizing-content min-h-10 flex-1 resize-none rounded-xl border border-line bg-bg px-3 py-2 text-sm leading-6 outline-none placeholder:text-muted/60 focus:border-brand-from"
            />
            <button
              type="submit"
              disabled={!draft.trim() || busy}
              className="h-10 shrink-0 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-40"
            >
              Add
            </button>
          </form>
          <p className="mt-2 text-[11px] text-muted">Enter to add · Shift + Enter for a new line · Edits save when you tap away</p>

          {error && <p className="mt-2 text-sm text-red-400" role="alert">{error}</p>}
          </>
          )}
        </div>
      )}
    </section>
  );
}
