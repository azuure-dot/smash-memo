import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  deleted: "Your account and all your notes have been deleted.",
  "reset-expired": "That reset link is invalid or has expired. Request a new one.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; notice?: string }>;
}) {
  const { next, notice } = await searchParams;

  return (
    <AuthShell subtitle="Matchup notes for Ultimate, Melee & Rivals 2, on every device.">
      {notice && NOTICES[notice] && (
        <p className="mb-4 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted" role="status">
          {NOTICES[notice]}
        </p>
      )}
      <LoginForm next={next ?? "/"} />
    </AuthShell>
  );
}
