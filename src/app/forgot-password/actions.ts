"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ResetState = { error?: string; message?: string };

/** Sends a password-reset email. The reply is the same whether or not the address has an account. */
export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  // Rate-limit errors are worth showing; anything else stays generic so accounts can't be probed.
  if (error?.status === 429) return { error: "Too many requests. Please wait a few minutes and try again." };

  return {
    message:
      "If an account exists for that address, a reset link is on its way. Open it on this device and browser.",
  };
}

/** Sets a new password for the user signed in through the reset link. */
export async function updatePassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { error: "Use a password of at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your reset link has expired. Request a new one." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  const returnTo = String(formData.get("return_to") ?? "/");
  revalidatePath("/", "layout");
  redirect(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/");
}
