import Link from "next/link";
import { NotebookPen } from "lucide-react";
import { NewMatchupForm } from "@/components/new-matchup-form";
import { cn } from "@/lib/cn";
import { GAME_LABELS } from "@/lib/game-data";
import { createClient } from "@/lib/supabase/server";
import type { Game, Matchup } from "@/lib/types";

const FILTERS: { key: "all" | Game; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ultimate", label: "Ultimate" },
  { key: "melee", label: "Melee" },
];

function timeAgo(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000], ["month", 2592000], ["week", 604800],
    ["day", 86400], ["hour", 3600], ["minute", 60],
  ];
  for (const [unit, secs] of steps) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return "just now";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const { game } = await searchParams;
  const filter: "all" | Game = game === "ultimate" || game === "melee" ? game : "all";

  const supabase = await createClient();
  let query = supabase
    .from("matchups")
    .select("id, game, my_character, opponent_character, updated_at")
    .order("updated_at", { ascending: false });
  if (filter !== "all") query = query.eq("game", filter);
  const { data } = await query;
  const matchups = (data ?? []) as Pick<Matchup, "id" | "game" | "my_character" | "opponent_character" | "updated_at">[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your matchups</h1>
          <p className="mt-1 text-sm text-muted">Stage picks, game plans and mid-set reminders.</p>
        </div>
      </div>

      <NewMatchupForm defaultOpen={matchups.length === 0 && filter === "all"} />

      <nav className="flex gap-1 border-b border-line" aria-label="Filter by game">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/" : `/?game=${f.key}`}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition",
              filter === f.key ? "border-brand-to text-fg" : "border-transparent text-muted hover:text-fg",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {matchups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
          <NotebookPen className="size-7 text-muted" aria-hidden />
          <p className="text-sm text-muted">No matchup notes yet. Create your first one above.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {matchups.map((m) => (
            <li key={m.id}>
              <Link
                href={`/matchups/${m.id}`}
                className="group block rounded-2xl border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-brand-from/60 hover:shadow-lg hover:shadow-brand-from/10"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                    {GAME_LABELS[m.game]}
                  </span>
                  <span className="text-xs text-muted">{timeAgo(m.updated_at)}</span>
                </div>
                <p className="truncate text-base font-semibold">
                  {m.my_character}
                  <span className="text-brand mx-2 text-sm font-bold">vs</span>
                  {m.opponent_character}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
