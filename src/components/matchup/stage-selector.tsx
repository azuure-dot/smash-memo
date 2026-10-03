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

/** Ink colour of the silhouette and the handwritten mark. */
const INK: Record<StageStatus, string> = {
  neutral: "text-muted/70",
  prefer: "text-prefer",
  avoid: "text-avoid",
};

const COLUMNS = "id, matchup_id, name, status, is_custom, position";

/** A loose, open-ended pen loop around a word, as if circled by hand. */
function InkCircle() {
  return (
    <svg
      viewBox="0 0 120 44"
      preserveAspectRatio="none"
      aria-hidden
      className="pointer-events-none absolute -left-3.5 -top-2 h-[calc(100%+1rem)] w-[calc(100%+1.75rem)] text-avoid"
    >
      <path
        d="M14 9 C 38 1, 98 2, 114 15 C 124 25, 106 40, 62 41 C 22 42, 2 34, 5 21 C 7 12, 24 6, 46 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Stage name marked like on paper: blue highlighter (prefer), red pen circle (avoid), plain pencil (neutral). */
function MarkedName({ name, status }: { name: string; status: StageStatus }) {
  return (
    <span className="relative inline-block max-w-full">
      <span
        className={cn(
          "line-clamp-2 font-serif text-[14px] leading-snug",
          status === "prefer" && "marker marker-prefer font-semibold",
          status === "avoid" && "font-semibold",
          status === "neutral" && "text-fg/80",
        )}
      >
        {name}
      </span>
      {status === "avoid" && <InkCircle />}
    </span>
  );
}

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

  const setStatus = (id: string, status: StageStatus) =>
    setStages((s) => s.map((x) => (x.id === id ? { ...x, status } : x)));

  async function cycle(stage: MatchupStage) {
    const next = NEXT[stage.status];
    setError(null);
    setStatus(stage.id, next);
    const { error } = await supabase.from("matchup_stages").update({ status: next }).eq("id", stage.id);
    if (error) {
      setStatus(stage.id, stage.status);
      setError("Couldn't save that change. Check your connection and try again.");
    }
  }

  async function addStage(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (stages.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setError(`“${name}” is already in the list.`);
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
      setError("Couldn't add that stage. Check your connection and try again.");
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
      setError("Couldn't remove that stage. Check your connection and try again.");
    }
  }

  const preferred = stages.filter((s) => s.status === "prefer").length;
  const avoided = stages.filter((s) => s.status === "avoid").length;

  return (
    <section className="paper rounded-lg px-4 pb-2 pt-4 sm:px-6 sm:pb-3 sm:pt-5" aria-labelledby="stages-title">
      {/* Always visible: title, the preferred / avoided summary and the toggle. */}
      <div className="flex items-center justify-between gap-3 pb-2">
        <div className="min-w-0">
          <h2 id="stages-title" className="font-serif text-lg font-semibold">Stages</h2>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] tabular-nums">
            <span className="marker marker-prefer text-prefer">{preferred} preferred</span>
            <span className="text-avoid underline decoration-avoid/60 decoration-wavy decoration-1 underline-offset-4">
              {avoided} avoided
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUserOpen(!open)}
          aria-expanded={open ?? undefined}
          aria-controls="stages-panel"
          className="group flex h-9 shrink-0 items-center gap-1.5 rounded-md px-2 text-[13px] text-muted transition-colors hover:text-brand"
        >
          <span className="underline decoration-dashed decoration-1 underline-offset-4 group-hover:decoration-solid">
            {open === null ? (
              // Before hydration: same breakpoint as the panel's CSS default (collapsed on mobile).
              <>
                <span className="md:hidden">Show Stagelist</span>
                <span className="hidden md:inline">Hide Stagelist</span>
              </>
            ) : open ? (
              "Hide Stagelist"
            ) : (
              "Show Stagelist"
            )}
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-3.5 transition-transform duration-300 motion-reduce:transition-none",
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
        {/* Side padding inside the clipped area leaves room for the hand-drawn circles. */}
        <div className="-mx-2 min-h-0 overflow-hidden" inert={open === false}>
          <div className="px-2 pb-3 pt-2">
            <p className="mb-3 text-xs text-muted">
              {readOnly ? (
                <>
                  <span className="text-prefer">Highlighted</span> = preferred, <span className="text-avoid">circled</span>{" "}
                  = avoided.
                </>
              ) : (
                <>
                  Tap a stage: <span className="text-prefer">highlight</span> it to prefer it, tap again to{" "}
                  <span className="text-avoid">circle</span> it as avoided, once more to clear.
                </>
              )}
            </p>

            <ul className="grid grid-cols-2 gap-x-2 gap-y-1 sm:grid-cols-3 lg:grid-cols-5">
              {stages.map((stage) => {
                const body = (
                  <>
                    <StageGlyph name={stage.name} className={cn("h-9 w-full max-w-[7.5rem]", INK[stage.status])} />
                    <MarkedName name={stage.name} status={stage.status} />
                    <span
                      className={cn(
                        "font-hand text-[17px] leading-none",
                        stage.status === "neutral" ? "text-muted" : INK[stage.status],
                      )}
                    >
                      {stage.status === "prefer" ? "prefer ✓" : stage.status === "avoid" ? "avoid ✗" : "neutral"}
                    </span>
                  </>
                );
                const boxClass =
                  "flex h-full w-full flex-col items-center gap-2 rounded-md px-2 pb-3 pt-3 text-center";

                return (
                  <li key={stage.id} className="group relative">
                    {readOnly ? (
                      <div aria-label={`${stage.name}: ${LABEL[stage.status]}`} className={boxClass}>
                        {body}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => cycle(stage)}
                        aria-label={`${stage.name}: ${LABEL[stage.status]}. Tap to change.`}
                        className={cn(boxClass, "transition-colors hover:bg-surface-2 active:bg-surface-2")}
                      >
                        {body}
                      </button>
                    )}
                    {stage.is_custom && !readOnly && (
                      <button
                        type="button"
                        onClick={() => confirm(`Remove “${stage.name}” from this note?`) && removeStage(stage)}
                        className="absolute right-1 top-1 grid size-7 place-items-center rounded-md text-muted opacity-100 transition-[opacity,color] hover:text-avoid focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                        aria-label={`Remove ${stage.name}`}
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    )}
                  </li>
                );
              })}

              {!readOnly && (
                <li>
                  {adding ? (
                    <form
                      onSubmit={addStage}
                      className="flex h-full flex-col justify-center gap-2 rounded-md border border-dashed border-brand-from/50 p-2"
                    >
                      <label htmlFor="new-stage-name" className="sr-only">
                        Stage name
                      </label>
                      <input
                        id="new-stage-name"
                        name="stage"
                        autoFocus
                        autoComplete="off"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
                        placeholder="Stage name…"
                        maxLength={60}
                        className="w-full border-0 border-b border-line bg-transparent px-1 py-1 font-serif text-sm outline-none placeholder:text-muted focus-visible:border-fg/60"
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="submit"
                          className="flex-1 rounded-md bg-brand py-1 text-xs font-semibold text-on-brand transition-[filter] hover:brightness-110"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdding(false)}
                          className="flex-1 rounded-md py-1 text-xs text-muted transition-colors hover:text-fg"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAdding(true)}
                      className="flex h-full min-h-28 w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line text-muted transition-colors hover:border-brand-from hover:text-brand"
                    >
                      <Plus className="size-5" aria-hidden />
                      <span className="font-hand text-lg leading-none">add a stage</span>
                    </button>
                  )}
                </li>
              )}
            </ul>

            {error && (
              <p className="mt-3 text-sm text-avoid" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
