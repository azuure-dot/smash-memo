import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = { title: "Choose a new password" };

/** Reached from the reset email: /auth/callback signs the user in, then sends them here. */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?notice=reset-expired");

  return (
    <AuthShell title="Choose a new password" subtitle={user.email ?? undefined}>
      <ResetPasswordForm email={user.email ?? ""} />
    </AuthShell>
  );
}
