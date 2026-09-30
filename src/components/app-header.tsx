import Link from "next/link";
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
        <div className="flex items-center gap-2">
          {user?.email && <span className="hidden text-xs text-muted sm:inline">{user.email}</span>}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
