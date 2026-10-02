"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type DeleteAccountState = { error?: string };

/** Permanently deletes the signed-in user and, by cascade, all of their matchups and notes. */
export async function deleteAccount(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  if (formData.get("confirm") !== "DELETE") return { error: "Type DELETE to confirm." };

  const supabase = await createClient();

  // Storage files don't cascade with the account: remove the profile picture(s) first.
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims.sub;
  if (uid) {
    const { data: files } = await supabase.storage.from("avatars").list(uid);
    if (files?.length) await supabase.storage.from("avatars").remove(files.map((f) => `${uid}/${f.name}`));
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: "Couldn't delete your account. Please try again." };

  // The user no longer exists; this just clears the session cookies.
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login?notice=deleted");
}
