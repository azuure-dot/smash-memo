"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ShareActionResult = { error?: string };

/** Turns the share link of one of your notes on or off. */
export async function setSharing(id: string, shared: boolean): Promise<ShareActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("matchups").update({ is_shared: shared }).eq("id", id).select("id");
  if (error || !data?.length) return { error: "Couldn't update sharing. Check your connection." };
  revalidatePath(`/share/${id}`);
  revalidatePath(`/matchups/${id}`); // shows / hides the author badge on the owner's page
  return {};
}

/** Bookmarks someone else's shared note in "Saved Notes", or removes the bookmark. */
export async function setSaved(id: string, saved: boolean): Promise<ShareActionResult> {
  const supabase = await createClient();
  if (saved) {
    const { data, error } = await supabase.rpc("save_shared_matchup", { p_id: id });
    if (error || data === false) return { error: "Couldn't save this note. It may no longer be shared." };
  } else {
    const { error } = await supabase.from("saved_matchups").delete().eq("matchup_id", id);
    if (error) return { error: "Couldn't remove this note from your workspace." };
  }
  revalidatePath("/");
  revalidatePath(`/share/${id}`);
  return {};
}

/** Deep-copies a shared note into your account, then opens the editable copy. */
export async function duplicateSharedMatchup(id: string): Promise<ShareActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("duplicate_shared_matchup", { p_id: id });
  if (error || !data) return { error: "Couldn't duplicate this note. It may no longer be shared." };
  revalidatePath("/");
  redirect(`/matchups/${data}`);
}
