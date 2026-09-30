import Link from "next/link";
import { UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "./sign-out-button";

export async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-xl bg-brand text-xs font-bold text-white">SN</span>
          <span className="font-semibold tracking-tight">Smash Notes</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/account"
            className="flex h-9 items-center gap-2 rounded-xl px-2.5 text-muted transition hover:bg-surface-2 hover:text-fg"
            aria-label="Account"
            title="Account"
          >
            <UserRound className="size-4" />
            {user?.email && <span className="hidden max-w-48 truncate text-xs sm:inline">{user.email}</span>}
          </Link>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
