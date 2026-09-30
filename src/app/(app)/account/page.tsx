import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { ResetPasswordForm } from "@/app/reset-password/reset-password-form";
import { createClient } from "@/lib/supabase/server";
import { DeleteAccountForm } from "./delete-account-form";

export const metadata = { title: "Account" };

function Card({ title, danger, children }: { title: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <section
      className={`rounded-2xl border bg-surface p-4 sm:p-5 ${danger ? "border-red-500/40" : "border-line"}`}
    >
      <h2 className={`mb-4 font-semibold ${danger ? "text-red-300" : ""}`}>{title}</h2>
      {children}
    </section>
  );
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string }>;
}) {
  const { updated } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count } = await supabase.from("matchups").select("id", { count: "exact", head: true });
  const memberSince = new Date(user.created_at).toLocaleDateString("en", { dateStyle: "long" });

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <Link href="/" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg">
          <ArrowLeft className="size-4" /> Matchups
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
      </div>

      <Card title="Profile">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted">Email</dt>
          <dd className="truncate">{user.email}</dd>
          <dt className="text-muted">Member since</dt>
          <dd>{memberSince}</dd>
          <dt className="text-muted">Matchups</dt>
          <dd>{count ?? 0}</dd>
        </dl>
      </Card>

      <Card title="Change password">
        {updated === "password" && (
          <p className="mb-3 text-sm text-emerald-300" role="status">Your password has been updated.</p>
        )}
        <ResetPasswordForm
          email={user.email ?? ""}
          returnTo="/account?updated=password"
          submitLabel="Update password"
          bare
        />
      </Card>

      <Card title="Privacy">
        <Link
          href="/privacy"
          className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-sm transition hover:border-brand-from/60"
        >
          <ShieldCheck className="size-4 text-brand-to" aria-hidden />
          What we store and who can see it
        </Link>
      </Card>

      <Card title="Delete account" danger>
        <DeleteAccountForm matchupCount={count ?? 0} />
      </Card>
    </div>
  );
}
