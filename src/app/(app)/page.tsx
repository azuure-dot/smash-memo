import { Dashboard } from "@/components/dashboard";
import type { MatchupSummary } from "@/components/matchup-list";
import { createClient } from "@/lib/supabase/server";
import type { SavedMatchup } from "@/lib/types";

export default async function DashboardPage() {
  // Load every note once; the game (?game=…) and tab (?tab=…) are applied client-side in <Dashboard>.
  const supabase = await createClient();
  const [{ data }, { data: savedData }] = await Promise.all([
    supabase
      .from("matchups")
      .select("id, game, my_character, opponent_character, updated_at, is_shared, copied_from")
      .order("updated_at", { ascending: false }),
    supabase.rpc("list_saved_matchups"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Your matchups</h1>
        <p className="mt-1.5 text-sm text-muted">Stage picks, game plans and mid-set reminders.</p>
      </div>

      <Dashboard matchups={(data ?? []) as MatchupSummary[]} saved={(savedData ?? []) as SavedMatchup[]} />
    </div>
  );
}
