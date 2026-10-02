import Link from "next/link";
import { UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { Avatar } from "./avatar";
import { SignOutButton } from "./sign-out-button";

export async function AppHeader() {
  const supabase = await createClient();
  // getClaims() reads the already-verified session token: no extra network round trip.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;
  const { data: profileData } = user
    ? await supabase.from("profiles").select("username, avatar_url").eq("id", user.sub).maybeSingle()
    : { data: null };
  const profile = profileData as Profile | null;
  const label = profile?.username || user?.email;

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-xl bg-brand text-xs font-bold text-white">SM</span>
          <span className="font-semibold tracking-tight">Smash Mémo</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/account"
            className="flex h-9 items-center gap-2 rounded-xl px-2 text-muted transition hover:bg-surface-2 hover:text-fg"
            aria-label="Account"
            title="Account"
          >
            {profile?.avatar_url || profile?.username ? (
              <Avatar url={profile.avatar_url} name={profile.username} className="size-7 text-[11px]" />
            ) : (
              <UserRound className="size-4" />
            )}
            {label && <span className="hidden max-w-48 truncate text-xs sm:inline">{label}</span>}
          </Link>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
