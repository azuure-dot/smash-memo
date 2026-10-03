import Link from "next/link";
import { UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { Avatar } from "./avatar";
import { BrandLogo } from "./brand-logo";
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
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/85 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <a
        href="#main"
        className="sr-only rounded-md bg-surface px-3 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center" aria-label="Smash Memo home">
          <BrandLogo />
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/account"
            className="flex h-9 items-center gap-2 rounded-md px-2 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            aria-label="Account"
            title="Account"
          >
            {profile?.avatar_url || profile?.username ? (
              <Avatar url={profile.avatar_url} name={profile.username} className="size-7 text-[11px]" />
            ) : (
              <UserRound className="size-4" aria-hidden />
            )}
            {label && <span className="hidden max-w-48 truncate text-xs sm:inline">{label}</span>}
          </Link>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
