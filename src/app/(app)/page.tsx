import { MatchupList, type Filter, type MatchupSummary, type Tab } from "@/components/matchup-list";
import { NewMatchupForm } from "@/components/new-matchup-form";
import { isGame } from "@/lib/game-data";
import { createClient } from "@/lib/supabase/server";
import type { SavedMatchup } from "@/lib/types";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; tab?: string }>;
}) {
  const { game, tab } = await searchParams;
  const filter: Filter = isGame(game) ? game : "all";
  const initialTab: Tab = tab === "saved" ? "saved" : "mine";

  // Load everything once; tabs and the game filter run client-side in MatchupList.
  const supabase = await createClient();
  const [{ data }, { data: savedData }] = await Promise.all([
    supabase
      .from("matchups")
      .select("id, game, my_character, opponent_character, updated_at, is_shared, copied_from")
      .order("updated_at", { ascending: false }),
    supabase.rpc("list_saved_matchups"),
  ]);
  const matchups = (data ?? []) as MatchupSummary[];
  const saved = (savedData ?? []) as SavedMatchup[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your matchups</h1>
          <p className="mt-1 text-sm text-muted">Stage picks, game plans and mid-set reminders.</p>
        </div>
      </div>

      <NewMatchupForm defaultOpen={matchups.length === 0 && saved.length === 0} />

      <MatchupList matchups={matchups} saved={saved} initialTab={initialTab} initialFilter={filter} />
    </div>
  );
}
