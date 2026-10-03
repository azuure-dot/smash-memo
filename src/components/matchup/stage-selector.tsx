"use client";

import { ChevronDown, Plus, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import type { MatchupStage, StageStatus } from "@/lib/types";
import { useMediaQuery } from "@/lib/use-media-query";
import { StageGlyph } from "./stage-glyph";

const NEXT: Record<StageStatus, StageStatus> = { neutral: "prefer", prefer: "avoid", avoid: "neutral" };

const LABEL: Record<StageStatus, string> = { neutral: "Neutral", prefer: "Prefer", avoid: "Avoid" };

const CARD: Record<StageStatus, string> = {
  neutral: "border-line bg-surface-2/60 text-muted hover:border-brand-from/50 hover:text-fg",
  prefer: "border-blue-500/70 bg-blue-500/10 text-blue-300 shadow-[0_0_24px_-8px] shadow-blue-500/60",
  avoid: "border-red-500/70 bg-red-500/10 text-red-300 shadow-[0_0_24px_-8px] shadow-red-500/60",
};

/** Same colours without the hover affordance, for the read-only shared view. */
const READONLY_CARD: Record<StageStatus, string> = {
  neutral: "border-line bg-surface-2/60 text-muted",
  prefer: CARD.prefer,
  avoid: CARD.avoid,
};

const COLUMNS = "id, matchup_id, name, status, is_custom, position";

export function StageSelector({
  matchupId,
  initialStages,
  readOnly = false,
}: {
  matchupId: string;
  initialStages: MatchupStage[];
  /** Shared view: statuses are shown but can't be changed. */
  readOnly?: boolean;
}) {
  const supabase = createClient();
  const [stages, setStages] = useState(initialStages);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Collapsed by default on small screens, open on desktop. `null` = not hydrated yet: CSS shows the
  // right default meanwhile (no flash). Once the user clicks the toggle, their choice wins.
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const open = userOpen ?? isDesktop;

  const setStatus =(id: string, status: StageStatus) =>
    setStages((s) => s.map((x) => (x.id === id ? { ...x, status } : x)));

  async function cycle(stage: MatchupStage) {
    const next = NEXT[stage.status];
    setError(null);
    setStatus(stage.id, next);
    const { error } = await supabase.from("matchup_stages").update({ status: next }).eq("id", stage.id);
    if (error) {
      setStatus(stage.id, stage.status);
      setError("Couldn't save that change. Check your connection.");
    }
  }

  async function addStage(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (stages.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setError(`"${name}" is already in the list.`);
      return;
    }
    setError(null);
    const position = stages.reduce((max, s) => Math.max(max, s.position), -1) + 1;
    const { data, error } = await supabase
      .from("matchup_stages")
      .insert({ matchup_id: matchupId, name, is_custom: true, position })
      .select(COLUMNS)
      .single();
    if (error || !data) {
      setError("Couldn't add that stage.");
      return;
    }
    setStages((s) => [...s, data as MatchupStage]);
    setNewName("");
    setAdding(false);
  }

  async function removeStage(stage: MatchupStage) {
    const before = stages;
    setStages((s) => s.filter((x) => x.id !== stage.id));
    const { error } = await supabase.from("matchup_stages").delete().eq("id", stage.id);
    if (error) {
      setStages(before);
      setError("Couldn't remove that stage.");
    }
  }

  const preferred = stages.filter((s) => s.status === "prefer").length;
  const avoided = stages.filter((s) => s.status === "avoid").length;

  return (
    <section
      className="rounded-2xl border border-line bg-surface px-4 pb-2 pt-4 sm:px-5 sm:pb-3 sm:pt-5"
      aria-labelledby="stages-title"
    >
      {/* Always visible: title, the preferred / avoided summary and the toggle. */}
      <div className="flex items-center justify-between gap-3 pb-2">
        <div className="min-w-0">
          <h2 id="stages-title" className="font-semibold">Stages</h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="flex items-center gap-1.5 text-blue-300">
              <span className="size-2 rounded-full bg-blue-400" /> {preferred} preferred
            </span>
            <span className="flex items-center gap-1.5 text-red-300">
              <span className="size-2 rounded-full bg-red-400" /> {avoided} avoided
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setUserOpen(!open)}
          aria-expanded={open ?? undefined}
          aria-controls="stages-panel"
          className={cn(
            "flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition",
            "border-line text-muted hover:border-brand-from/60 hover:bg-brand-from/10 hover:text-fg",
            open && "border-brand-from/40 text-fg",
          )}
        >
          {open === null ? (
            // Before hydration: same breakpoint as the panel's CSS default (collapsed on mobile).
            <>
              <span className="md:hidden">Show stagelist</span>
              <span className="hidden md:inline">Hide stagelist</span>
            </>
          ) : open ? (
            "Hide stagelist"
          ) : (
            "Show stagelist"
          )}
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-300",
              open === null ? "md:rotate-180" : open && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Collapsible part: animating grid rows 0fr ↔ 1fr gives a smooth slide to the content's real height. */}
      <div
        id="stages-panel"
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          open === null ? "grid-rows-[0fr] md:grid-rows-[1fr]" : open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        {/* Side padding inside the clipped area keeps the cards' glow visible. */}
        <div className="-mx-2 min-h-0 overflow-hidden" inert={open === false}>
          <div className="px-2 pb-3 pt-2">
            <p className="mb-3 text-xs text-muted">
              {readOnly ? (
                <>
                  <span className="text-blue-300">Prefer</span> and <span className="text-red-300">Avoid</span> picks for
                  this matchup
                </>
              ) : (
                <>
                  Tap a stage to cycle Neutral → <span className="text-blue-300">Prefer</span> →{" "}
                  <span className="text-red-300">Avoid</span>
                </>
              )}
            </p>

            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {stages.map((stage) => (
                <li key={stage.id} className="group relative">
                  {readOnly ? (
                    <div
                      aria-label={`${stage.name}: ${LABEL[stage.status]}`}
                      className={cn(
                        "flex h-full w-full flex-col items-center gap-1.5 rounded-xl border px-2 pb-2.5 pt-3 text-center",
                        READONLY_CARD[stage.status],
                      )}
                    >
                      <StageGlyph name={stage.name} className="h-9 w-full max-w-[7.5rem]" />
                      <span className="line-clamp-2 text-[13px] font-medium leading-tight text-fg">{stage.name}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{LABEL[stage.status]}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => cycle(stage)}
                      aria-label={`${stage.name}: ${LABEL[stage.status]}. Tap to change.`}
                      className={cn(
                        "flex h-full w-full flex-col items-center gap-1.5 rounded-xl border px-2 pb-2.5 pt-3 text-center transition active:scale-[0.97]",
                        CARD[stage.status],
                      )}
                    >
                      <StageGlyph name={stage.name} className="h-9 w-full max-w-[7.5rem]" />
                      <span className="line-clamp-2 text-[13px] font-medium leading-tight text-fg">{stage.name}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{LABEL[stage.status]}</span>
                    </button>
                  )}
                  {stage.is_custom && !readOnly && (
                    <button
                      type="button"
                      onClick={() => removeStage(stage)}
                      className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-md text-muted opacity-100 transition hover:bg-bg hover:text-fg sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                      aria-label={`Remove ${stage.name}`}
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </li>
              ))}

              {!readOnly && (
                <li>
                  {adding ? (
                    <form
                      onSubmit={addStage}
                      className="flex h-full flex-col justify-center gap-2 rounded-xl border border-brand-from/60 bg-surface-2/60 p-2"
                    >
                      <input
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
                        placeholder="Stage name"
                        maxLength={60}
                        className="w-full rounded-lg border border-line bg-bg px-2 py-1.5 text-sm outline-none focus:border-brand-from"
                      />
                      <div className="flex gap-1.5">
                        <button type="submit" className="flex-1 rounded-lg bg-brand py-1 text-xs font-semibold text-white">
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdding(false)}
                          className="flex-1 rounded-lg border border-line py-1 text-xs text-muted hover:text-fg"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAdding(true)}
                      className="flex h-full min-h-28 w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line text-sm text-muted transition hover:border-brand-to hover:text-fg"
                    >
                      <Plus className="size-5" />
                      Add stage
                    </button>
                  )}
                </li>
              )}
            </ul>

            {error && <p className="mt-3 text-sm text-red-400" role="alert">{error}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
