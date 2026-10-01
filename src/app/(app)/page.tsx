import { MatchupList, type Filter, type MatchupSummary } from "@/components/matchup-list";
import { NewMatchupForm } from "@/components/new-matchup-form";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const { game } = await searchParams;
  const filter: Filter = game === "ultimate" || game === "melee" ? game : "all";

  // Load every matchup once; the game filter runs client-side in MatchupList.
  const supabase = await createClient();
  const { data } = await supabase
    .from("matchups")
    .select("id, game, my_character, opponent_character, updated_at")
    .order("updated_at", { ascending: false });
  const matchups = (data ?? []) as MatchupSummary[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your matchups</h1>
          <p className="mt-1 text-sm text-muted">Stage picks, game plans and mid-set reminders.</p>
        </div>
      </div>

      <NewMatchupForm defaultOpen={matchups.length === 0} />

      <MatchupList matchups={matchups} initialFilter={filter} />
    </div>
  );
}
