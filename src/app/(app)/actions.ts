"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canonicalCharacter, dashboardHref, isGame } from "@/lib/game-data";
import { createClient } from "@/lib/supabase/server";

export type CreateMatchupState = { error?: string };

/** Creates "[My Character] vs [Opponent]" (or reuses an existing one) and opens it. */
export async function createMatchup(
  _prev: CreateMatchupState,
  formData: FormData,
): Promise<CreateMatchupState> {
  const game = formData.get("game");
  if (!isGame(game)) return { error: "Pick a game." };

  const mine = canonicalCharacter(game, String(formData.get("my_character") ?? ""));
  const opp = canonicalCharacter(game, String(formData.get("opponent_character") ?? ""));
  if (!mine || !opp) return { error: "Choose both characters." };
  if (mine.length > 60 || opp.length > 60) return { error: "Character names are too long." };

  const supabase = await createClient();

  // Several notes can exist for one matchup (e.g. a duplicated one): open the most recent.
  const { data: existing } = await supabase
    .from("matchups")
    .select("id")
    .eq("game", game)
    .eq("my_character", mine)
    .eq("opponent_character", opp)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let id: string | undefined = existing?.id;

  if (!id) {
    const { data, error } = await supabase
      .from("matchups")
      .insert({ game, my_character: mine, opponent_character: opp })
      .select("id")
      .single();
    if (error || !data) return { error: error?.message ?? "Couldn't create the matchup." };
    id = data.id;
  }

  revalidatePath("/");
  redirect(`/matchups/${id}`);
}

export async function deleteMatchup(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("matchups").delete().eq("id", id).select("game");
  revalidatePath("/");
  // Back to the dashboard on the deleted note's game.
  const game = data?.[0]?.game;
  redirect(isGame(game) ? dashboardHref(game) : "/");
}
